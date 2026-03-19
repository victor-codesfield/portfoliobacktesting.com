package services

import (
	"fmt"
	"math"
	"math/rand"
	"sort"
	"strings"
	"sync"
	"time"
)

type DateRange struct {
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
}

type YearsOrDateRange struct {
	Years     *int
	DateRange *DateRange
}

type TickerResult struct {
	FinalValue      float64        `json:"final_value" bson:"final_value"`
	FinalShares     float64        `json:"final_shares" bson:"final_shares"`
	PortfolioValues []float64      `json:"portfolio_values" bson:"portfolio_values"`
	MonthlyCloses   []MonthlyClose `json:"monthly_closes" bson:"monthly_closes"`
}

type MonteCarloMonth struct {
	Month string  `json:"month" bson:"month"`
	P10   float64 `json:"p10" bson:"p10"`
	P25   float64 `json:"p25" bson:"p25"`
	P50   float64 `json:"p50" bson:"p50"`
	P75   float64 `json:"p75" bson:"p75"`
	P90   float64 `json:"p90" bson:"p90"`
}

type MonteCarloPercentiles struct {
	P5  float64 `json:"p5" bson:"p5"`
	P10 float64 `json:"p10" bson:"p10"`
	P25 float64 `json:"p25" bson:"p25"`
	P50 float64 `json:"p50" bson:"p50"`
	P75 float64 `json:"p75" bson:"p75"`
	P90 float64 `json:"p90" bson:"p90"`
	P95 float64 `json:"p95" bson:"p95"`
}

type MonteCarloResult struct {
	Simulations int                   `json:"simulations" bson:"simulations"`
	Percentiles MonteCarloPercentiles `json:"percentiles" bson:"percentiles"`
	FanChart    []MonteCarloMonth     `json:"fan_chart" bson:"fan_chart"`
}

type AnalysisResult struct {
	TickerResults     map[string]*TickerResult `json:"ticker_results" bson:"ticker_results"`
	CombinedPortfolio struct {
		FinalValue      float64   `json:"final_value" bson:"final_value"`
		PortfolioValues []float64 `json:"portfolio_values" bson:"portfolio_values"`
	} `json:"combined_portfolio" bson:"combined_portfolio"`
	UnifiedMonths     []int              `json:"unified_months" bson:"unified_months"`
	MaxMonths         int                `json:"max_months" bson:"max_months"`
	Tickers           []string           `json:"tickers" bson:"tickers"`
	AllocationRatios  []float64          `json:"allocation_ratios" bson:"allocation_ratios"`
	MonthlyInvestment float64            `json:"monthly_investment" bson:"monthly_investment"`
	Years             float64            `json:"years" bson:"years"`
	DateRangeData     *DateRange         `json:"dateRange" bson:"dateRange"`
	MonteCarlo        *MonteCarloResult  `json:"monte_carlo,omitempty" bson:"monte_carlo,omitempty"`
}

func resolveStartEnd(yod YearsOrDateRange) (time.Time, time.Time, error) {
	if yod.Years != nil {
		endDate := time.Now()
		startDate := endDate.AddDate(-*yod.Years, 0, 0)
		return startDate, endDate, nil
	}
	if yod.DateRange != nil {
		return yod.DateRange.StartDate, yod.DateRange.EndDate, nil
	}
	return time.Time{}, time.Time{}, fmt.Errorf("must provide years or dateRange")
}

func resolveYears(yod YearsOrDateRange) float64 {
	if yod.Years != nil {
		return float64(*yod.Years)
	}
	if yod.DateRange != nil {
		diff := yod.DateRange.EndDate.Sub(yod.DateRange.StartDate)
		return diff.Hours() / (24 * 365.25)
	}
	return 1
}

func CalculateTickerPortfolio(ticker string, monthlyInvestment float64, yod YearsOrDateRange) (*TickerResult, error) {
	startDate, endDate, err := resolveStartEnd(yod)
	if err != nil {
		return nil, err
	}

	quotes, _, err := FetchChartData(ticker, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("error processing ticker %s: %w", ticker, err)
	}

	monthlyCloses := ExtractMonthlyCloses(quotes)
	if len(monthlyCloses) == 0 {
		return nil, fmt.Errorf("insufficient data for ticker %s", ticker)
	}

	var totalValue float64
	var numShares float64
	portfolioValues := make([]float64, 0, len(monthlyCloses))

	for _, mc := range monthlyCloses {
		newShares := monthlyInvestment / mc.Close
		numShares += newShares
		totalValue = numShares * mc.Close
		portfolioValues = append(portfolioValues, totalValue)
	}

	return &TickerResult{
		FinalValue:      totalValue,
		FinalShares:     numShares,
		PortfolioValues: portfolioValues,
		MonthlyCloses:   monthlyCloses,
	}, nil
}

func GetSNPPortfolioValues(monthlyInvestment float64, yod YearsOrDateRange) (*TickerResult, error) {
	return CalculateTickerPortfolio("^GSPC", monthlyInvestment, yod)
}

// GetUSDSavingsValues generates a cash savings benchmark.
// actualMonths is derived from real ticker data so the USD series always has
// the same length as the stock series — fixing the old years*12 mismatch bug.
func GetUSDSavingsValues(monthlyInvestment float64, actualMonths int) *TickerResult {
	savingsValues := make([]float64, actualMonths)
	monthlyCloses := make([]MonthlyClose, actualMonths)
	var totalSaved float64

	for i := 0; i < actualMonths; i++ {
		totalSaved += monthlyInvestment
		savingsValues[i] = totalSaved
		monthlyCloses[i] = MonthlyClose{
			Month: fmt.Sprintf("Month %d", i+1),
			Date:  fmt.Sprintf("Month %d", i+1),
			Close: monthlyInvestment,
		}
	}

	return &TickerResult{
		FinalValue:      totalSaved,
		FinalShares:     float64(actualMonths),
		PortfolioValues: savingsValues,
		MonthlyCloses:   monthlyCloses,
	}
}

// calculateRebalancedPortfolio computes the combined portfolio with periodic rebalancing.
// All tickers are guaranteed to have the same number of months (pre-truncated in AnalyzePortfolio).
func calculateRebalancedPortfolio(tickers []string, allocationRatios []float64, tickerResults map[string]*TickerResult, monthlyInvestment float64, maxMonths int, rebalanceFrequency string) []float64 {
	tickerPrices := make(map[string][]float64)
	for _, ticker := range tickers {
		tr := tickerResults[ticker]
		prices := make([]float64, len(tr.MonthlyCloses))
		for i, mc := range tr.MonthlyCloses {
			prices[i] = mc.Close
		}
		tickerPrices[ticker] = prices
	}

	tickerShares := make(map[string]float64)
	tickerValues := make(map[string]float64)
	monthlyInvestmentPerTicker := make(map[string]float64)
	for i, ticker := range tickers {
		tickerShares[ticker] = 0
		tickerValues[ticker] = 0
		monthlyInvestmentPerTicker[ticker] = monthlyInvestment * allocationRatios[i]
	}

	combinedValues := make([]float64, 0, maxMonths)

	for monthIdx := 0; monthIdx < maxMonths; monthIdx++ {
		// Add monthly DCA investment
		for _, ticker := range tickers {
			currentPrice := tickerPrices[ticker][monthIdx]
			newShares := monthlyInvestmentPerTicker[ticker] / currentPrice
			tickerShares[ticker] += newShares
		}

		var isRebalancePoint bool
		switch rebalanceFrequency {
		case "quarterly":
			isRebalancePoint = (monthIdx+1)%3 == 0
		case "annual":
			isRebalancePoint = (monthIdx+1)%12 == 0
		}

		if isRebalancePoint {
			// Calculate total portfolio value
			var totalPortfolioValue float64
			for _, ticker := range tickers {
				currentPrice := tickerPrices[ticker][monthIdx]
				tickerValues[ticker] = tickerShares[ticker] * currentPrice
				totalPortfolioValue += tickerValues[ticker]
			}

			// Rebalance each ticker to target allocation
			for i, ticker := range tickers {
				currentPrice := tickerPrices[ticker][monthIdx]
				targetValue := totalPortfolioValue * allocationRatios[i]
				tickerShares[ticker] = targetValue / currentPrice
				tickerValues[ticker] = targetValue
			}
		}

		// Calculate combined value for this month
		var combinedValue float64
		for _, ticker := range tickers {
			currentPrice := tickerPrices[ticker][monthIdx]
			tickerValues[ticker] = tickerShares[ticker] * currentPrice
			combinedValue += tickerValues[ticker]
		}
		combinedValues = append(combinedValues, combinedValue)
	}

	return combinedValues
}

func AnalyzePortfolio(tickers []string, allocationRatios []float64, monthlyInvestment float64, yod YearsOrDateRange, rebalanceFrequency string, monteCarlo bool) (*AnalysisResult, error) {
	years := resolveYears(yod)

	if len(tickers) != len(allocationRatios) {
		return nil, fmt.Errorf("tickers and allocation_ratios must have the same length")
	}

	ratioSum := 0.0
	for _, r := range allocationRatios {
		if r < 0 {
			return nil, fmt.Errorf("allocation ratios must be non-negative")
		}
		ratioSum += r
	}
	if math.Abs(ratioSum-1.0) > 0.001 {
		return nil, fmt.Errorf("allocation ratios must sum to 1.0")
	}

	if monthlyInvestment < 0 {
		return nil, fmt.Errorf("monthly investment must be positive")
	}

	if len(tickers) > 10 {
		return nil, fmt.Errorf("maximum of 10 tickers allowed")
	}

	// Process all tickers in parallel, collecting ALL errors
	tickerResults := make(map[string]*TickerResult)
	var mu sync.Mutex
	var wg sync.WaitGroup
	var allErrors []string

	for idx, ticker := range tickers {
		wg.Add(1)
		go func(t string, i int) {
			defer wg.Done()
			investment := monthlyInvestment * allocationRatios[i]
			result, err := CalculateTickerPortfolio(t, investment, yod)
			mu.Lock()
			defer mu.Unlock()
			if err != nil {
				allErrors = append(allErrors, err.Error())
			}
			if result != nil {
				tickerResults[t] = result
			}
		}(ticker, idx)
	}
	wg.Wait()

	if len(allErrors) > 0 {
		return nil, fmt.Errorf("%s", strings.Join(allErrors, "; "))
	}

	// S&P 500 benchmark
	snpResult, err := GetSNPPortfolioValues(monthlyInvestment, yod)
	if err != nil {
		return nil, fmt.Errorf("error fetching S&P 500 data: %w", err)
	}
	tickerResults["^GSPC"] = snpResult

	// Find the minimum month count across all real tickers (including S&P)
	// so all series are the same length — no flat-line padding needed.
	minMonths := len(snpResult.PortfolioValues)
	for _, ticker := range tickers {
		tr := tickerResults[ticker]
		if len(tr.PortfolioValues) < minMonths {
			minMonths = len(tr.PortfolioValues)
		}
	}

	// Truncate all ticker results to the common month count
	for key, tr := range tickerResults {
		if key == "USD" {
			continue
		}
		if len(tr.PortfolioValues) > minMonths {
			tr.PortfolioValues = tr.PortfolioValues[:minMonths]
			tr.MonthlyCloses = tr.MonthlyCloses[:minMonths]
			if len(tr.PortfolioValues) > 0 {
				tr.FinalValue = tr.PortfolioValues[len(tr.PortfolioValues)-1]
			}
		}
	}

	// USD savings — use actual month count from real data
	usdResult := GetUSDSavingsValues(monthlyInvestment, minMonths)
	tickerResults["USD"] = usdResult

	maxMonths := minMonths

	unifiedMonths := make([]int, maxMonths)
	for i := range unifiedMonths {
		unifiedMonths[i] = i + 1
	}

	// Calculate combined portfolio values
	var combinedValues []float64
	hasMultipleYears := maxMonths > 12

	shouldRebalance := (rebalanceFrequency == "annual" || rebalanceFrequency == "quarterly") && hasMultipleYears
	if shouldRebalance {
		combinedValues = calculateRebalancedPortfolio(tickers, allocationRatios, tickerResults, monthlyInvestment, maxMonths, rebalanceFrequency)
	} else {
		combinedValues = make([]float64, maxMonths)
		for monthIdx := 0; monthIdx < maxMonths; monthIdx++ {
			var combinedValue float64
			for _, ticker := range tickers {
				tr := tickerResults[ticker]
				combinedValue += tr.PortfolioValues[monthIdx]
			}
			combinedValues[monthIdx] = combinedValue
		}
	}

	totalCombinedValue := 0.0
	if len(combinedValues) > 0 {
		totalCombinedValue = combinedValues[len(combinedValues)-1]
	}

	result := &AnalysisResult{
		TickerResults: tickerResults,
		UnifiedMonths:     unifiedMonths,
		MaxMonths:         maxMonths,
		Tickers:           tickers,
		AllocationRatios:  allocationRatios,
		MonthlyInvestment: monthlyInvestment,
		Years:             years,
	}
	result.CombinedPortfolio.FinalValue = totalCombinedValue
	result.CombinedPortfolio.PortfolioValues = combinedValues

	if yod.DateRange != nil {
		result.DateRangeData = yod.DateRange
	}

	// Monte Carlo simulation (bootstrap method)
	if monteCarlo && len(combinedValues) > 1 {
		// Get date labels from first custom ticker
		var dateLabels []string
		if len(tickers) > 0 {
			if tr, ok := tickerResults[tickers[0]]; ok {
				for _, mc := range tr.MonthlyCloses {
					dateLabels = append(dateLabels, mc.Date)
				}
			}
		}
		mcResult := RunMonteCarloSimulation(combinedValues, monthlyInvestment, maxMonths, dateLabels)
		result.MonteCarlo = mcResult
	}

	return result, nil
}

func RunMonteCarloSimulation(combinedValues []float64, monthlyInvestment float64, months int, dateLabels []string) *MonteCarloResult {
	const numSimulations = 1000

	// Extract monthly returns from combined portfolio
	monthlyReturns := make([]float64, 0, len(combinedValues)-1)
	for i := 1; i < len(combinedValues); i++ {
		if combinedValues[i-1] > 0 {
			ret := (combinedValues[i] - combinedValues[i-1] - monthlyInvestment) / combinedValues[i-1]
			monthlyReturns = append(monthlyReturns, ret)
		}
	}
	if len(monthlyReturns) == 0 {
		return nil
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	// Run simulations — store all values at each month
	// allSimValues[month][simulation] = value
	allSimValues := make([][]float64, months)
	for i := range allSimValues {
		allSimValues[i] = make([]float64, numSimulations)
	}
	finalValues := make([]float64, numSimulations)

	for s := 0; s < numSimulations; s++ {
		portfolio := 0.0
		for m := 0; m < months; m++ {
			portfolio += monthlyInvestment
			randReturn := monthlyReturns[rng.Intn(len(monthlyReturns))]
			portfolio *= (1 + randReturn)
			if portfolio < 0 {
				portfolio = 0
			}
			allSimValues[m][s] = portfolio
		}
		finalValues[s] = portfolio
	}

	// Build fan chart — percentiles at each month
	fanChart := make([]MonteCarloMonth, months)
	for m := 0; m < months; m++ {
		vals := allSimValues[m]
		sorted := make([]float64, numSimulations)
		copy(sorted, vals)
		sort.Float64s(sorted)

		dateLabel := fmt.Sprintf("Month %d", m+1)
		if m < len(dateLabels) && dateLabels[m] != "" {
			dateLabel = dateLabels[m]
		}

		fanChart[m] = MonteCarloMonth{
			Month: dateLabel,
			P10:   sorted[numSimulations*10/100],
			P25:   sorted[numSimulations*25/100],
			P50:   sorted[numSimulations*50/100],
			P75:   sorted[numSimulations*75/100],
			P90:   sorted[numSimulations*90/100],
		}
	}

	// Final value percentiles
	sort.Float64s(finalValues)
	percentiles := MonteCarloPercentiles{
		P5:  finalValues[numSimulations*5/100],
		P10: finalValues[numSimulations*10/100],
		P25: finalValues[numSimulations*25/100],
		P50: finalValues[numSimulations*50/100],
		P75: finalValues[numSimulations*75/100],
		P90: finalValues[numSimulations*90/100],
		P95: finalValues[numSimulations*95/100],
	}

	return &MonteCarloResult{
		Simulations: numSimulations,
		Percentiles: percentiles,
		FanChart:    fanChart,
	}
}

func ValidateTickerDataAvailability(tickers []string, yod YearsOrDateRange) map[string]interface{} {
	startDate, endDate, err := resolveStartEnd(yod)
	if err != nil {
		return map[string]interface{}{
			"valid":          false,
			"invalidTickers": []interface{}{},
			"tickerDetails":  map[string]interface{}{},
		}
	}

	years := resolveYears(yod)

	validationResult := map[string]interface{}{
		"valid":          true,
		"invalidTickers": []interface{}{},
		"tickerDetails":  map[string]interface{}{},
	}

	type tickerValidation struct {
		Ticker string
		Result map[string]interface{}
	}

	var wg sync.WaitGroup
	results := make(chan tickerValidation, len(tickers))

	for _, ticker := range tickers {
		wg.Add(1)
		go func(t string) {
			defer wg.Done()
			quotes, _, fetchErr := FetchChartData(t, startDate, endDate)
			if fetchErr != nil {
				results <- tickerValidation{t, map[string]interface{}{
					"ticker":       t,
					"valid":        false,
					"reason":       fmt.Sprintf("Error fetching data: %s", fetchErr.Error()),
					"earliestDate": nil,
				}}
				return
			}

			if len(quotes) == 0 {
				results <- tickerValidation{t, map[string]interface{}{
					"ticker":       t,
					"valid":        false,
					"reason":       "No data available from Yahoo Finance for this ticker",
					"earliestDate": nil,
				}}
				return
			}

			earliestDate := quotes[0].Date
			requiredDate := startDate.AddDate(0, 1, 0) // 1-month buffer

			if earliestDate.After(requiredDate) {
				results <- tickerValidation{t, map[string]interface{}{
					"ticker":       t,
					"valid":        false,
					"reason":       fmt.Sprintf("Insufficient historical data. Earliest available: %s, required: %s. Found %d valid data points. Need %.0f years of data.", earliestDate.Format("2006-01-02"), requiredDate.Format("2006-01-02"), len(quotes), years),
					"earliestDate": earliestDate.Format("2006-01-02"),
					"totalQuotes":  len(quotes),
					"validQuotes":  len(quotes),
				}}
				return
			}

			results <- tickerValidation{t, map[string]interface{}{
				"ticker":       t,
				"valid":        true,
				"earliestDate": earliestDate.Format("2006-01-02"),
			}}
		}(ticker)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	invalidTickers := []interface{}{}
	tickerDetails := map[string]interface{}{}

	for tv := range results {
		tickerDetails[tv.Ticker] = tv.Result
		if valid, ok := tv.Result["valid"].(bool); ok && !valid {
			validationResult["valid"] = false
			invalidTickers = append(invalidTickers, map[string]interface{}{
				"ticker":       tv.Ticker,
				"reason":       tv.Result["reason"],
				"earliestDate": tv.Result["earliestDate"],
			})
		}
	}

	validationResult["invalidTickers"] = invalidTickers
	validationResult["tickerDetails"] = tickerDetails
	return validationResult
}

func GeneratePortfolioCSV(analysisData map[string]interface{}, monthlyInvestment float64, rebalanceFrequency string) string {
	tickerResultsRaw, _ := analysisData["ticker_results"].(map[string]interface{})
	combinedPortfolioRaw, _ := analysisData["combined_portfolio"].(map[string]interface{})
	tickersRaw, _ := analysisData["tickers"].([]interface{})
	allocationRatiosRaw, _ := analysisData["allocation_ratios"].([]interface{})

	var tickers []string
	for _, t := range tickersRaw {
		if s, ok := t.(string); ok {
			tickers = append(tickers, s)
		}
	}

	var allocationRatios []float64
	for _, r := range allocationRatiosRaw {
		if f, ok := r.(float64); ok {
			allocationRatios = append(allocationRatios, f)
		}
	}

	customTickers := []string{}
	for _, t := range tickers {
		if t != "^GSPC" && t != "USD" {
			customTickers = append(customTickers, t)
		}
	}
	if len(customTickers) > 10 {
		customTickers = customTickers[:10]
	}

	combinedValues := []float64{}
	if cpVals, ok := combinedPortfolioRaw["portfolio_values"].([]interface{}); ok {
		for _, v := range cpVals {
			if f, ok := v.(float64); ok {
				combinedValues = append(combinedValues, f)
			}
		}
	}
	maxMonths := len(combinedValues)

	// Helper to get ticker data
	getTickerData := func(ticker string) ([]MonthlyClose, []float64) {
		trRaw, ok := tickerResultsRaw[ticker].(map[string]interface{})
		if !ok {
			return nil, nil
		}
		mcRaw, _ := trRaw["monthly_closes"].([]interface{})
		pvRaw, _ := trRaw["portfolio_values"].([]interface{})

		var monthlyCloses []MonthlyClose
		for _, m := range mcRaw {
			if mm, ok := m.(map[string]interface{}); ok {
				mc := MonthlyClose{}
				if s, ok := mm["month"].(string); ok {
					mc.Month = s
				}
				if s, ok := mm["date"].(string); ok {
					mc.Date = s
				}
				if f, ok := mm["close"].(float64); ok {
					mc.Close = f
				}
				monthlyCloses = append(monthlyCloses, mc)
			}
		}

		var portfolioValues []float64
		for _, v := range pvRaw {
			if f, ok := v.(float64); ok {
				portfolioValues = append(portfolioValues, f)
			}
		}
		return monthlyCloses, portfolioValues
	}

	// Build CSV
	var csvRows []string

	// Ticker names row
	tickerNamesRow := []string{"Ticker"}
	for _, t := range customTickers {
		tickerNamesRow = append(tickerNamesRow, t, "", "", "", "")
	}
	tickerNamesRow = append(tickerNamesRow, "", "", "", "", "", "", "", "")
	csvRows = append(csvRows, strings.Join(tickerNamesRow, ","))

	// Header row
	headers := []string{"date"}
	for i := 1; i <= len(customTickers); i++ {
		headers = append(headers, fmt.Sprintf("price%d", i), fmt.Sprintf("share%d", i), fmt.Sprintf("subTotShare%d", i), fmt.Sprintf("value%d", i), fmt.Sprintf("subTotVal%d", i))
	}
	headers = append(headers, "totalValue", "", "snpSharePrice", "snpShare", "snpValue", "snpTotal", "usdShare", "usdTotal")
	csvRows = append(csvRows, strings.Join(headers, ","))

	// Track running state
	tickerSharesOwned := make(map[string]float64)
	for _, t := range customTickers {
		tickerSharesOwned[t] = 0
	}
	var usdCumulative float64
	var snpShares float64

	snpMonthlyCloses, snpPortfolioValues := getTickerData("^GSPC")

	for monthIdx := 0; monthIdx < maxMonths; monthIdx++ {
		isLastMonth := monthIdx == maxMonths-1

		// Get date from first ticker
		dateStr := ""
		if len(customTickers) > 0 {
			mc, _ := getTickerData(customTickers[0])
			if mc != nil {
				idx := monthIdx
				if idx >= len(mc) {
					idx = len(mc) - 1
				}
				dateStr = mc[idx].Date
			}
		}

		row := []string{dateStr}

		for i, ticker := range customTickers {
			mc, _ := getTickerData(ticker)
			if mc == nil {
				row = append(row, "0", "0", "0", "0", "0")
				continue
			}
			idx := monthIdx
			if idx >= len(mc) {
				idx = len(mc) - 1
			}
			price := mc[idx].Close
			tickerIdx := -1
			for j, t := range tickers {
				if t == ticker {
					tickerIdx = j
					break
				}
			}
			var investment float64
			if tickerIdx >= 0 && tickerIdx < len(allocationRatios) {
				investment = monthlyInvestment * allocationRatios[tickerIdx]
			}
			_ = i

			sharesBought := 0.0
			if price > 0 {
				sharesBought = investment / price
			}
			tickerSharesOwned[ticker] += sharesBought
			valueOfSharesBought := sharesBought * price
			subTotVal := tickerSharesOwned[ticker] * price

			row = append(row,
				fmt.Sprintf("%.2f", price),
				fmt.Sprintf("%.6f", sharesBought),
				fmt.Sprintf("%.6f", tickerSharesOwned[ticker]),
				fmt.Sprintf("%.2f", valueOfSharesBought),
				fmt.Sprintf("%.2f", subTotVal),
			)
		}

		totalValue := 0.0
		if monthIdx < len(combinedValues) {
			totalValue = combinedValues[monthIdx]
		}
		row = append(row, fmt.Sprintf("%.2f", totalValue))
		row = append(row, "")

		// S&P 500
		var snpPrice, snpSharesBought, snpValueOfSharesBought, snpTotal float64
		if snpMonthlyCloses != nil && monthIdx < len(snpMonthlyCloses) {
			snpPrice = snpMonthlyCloses[monthIdx].Close
			if snpPrice > 0 {
				snpSharesBought = monthlyInvestment / snpPrice
				snpShares += snpSharesBought
			}
			snpValueOfSharesBought = snpSharesBought * snpPrice
			if snpPortfolioValues != nil && monthIdx < len(snpPortfolioValues) {
				snpTotal = snpPortfolioValues[monthIdx]
			}
		}
		row = append(row,
			fmt.Sprintf("%.2f", snpPrice),
			fmt.Sprintf("%.6f", snpSharesBought),
			fmt.Sprintf("%.2f", snpValueOfSharesBought),
			fmt.Sprintf("%.2f", snpTotal),
		)

		// USD
		usdCumulative += monthlyInvestment
		row = append(row, "1", fmt.Sprintf("%.2f", usdCumulative))

		csvRows = append(csvRows, strings.Join(row, ","))

		// Rebalance row at rebalance points
		var isRebalanceCSV bool
		switch rebalanceFrequency {
		case "quarterly":
			isRebalanceCSV = (monthIdx+1)%3 == 0
		case "annual":
			isRebalanceCSV = (monthIdx+1)%12 == 0
		}
		if isRebalanceCSV && !isLastMonth {
			rebalanceRow := []string{"rebalanced"}
			for _, ticker := range customTickers {
				mc, _ := getTickerData(ticker)
				if mc == nil {
					rebalanceRow = append(rebalanceRow, "0", "0", "0", "0", "0")
					continue
				}
				idx := monthIdx
				if idx >= len(mc) {
					idx = len(mc) - 1
				}
				price := mc[idx].Close

				if rebalanceFrequency == "annual" || rebalanceFrequency == "quarterly" {
					// Rebalance shares
					var totalPortfolioValue float64
					for _, t := range customTickers {
						tmc, _ := getTickerData(t)
						if tmc == nil {
							continue
						}
						tidx := monthIdx
						if tidx >= len(tmc) {
							tidx = len(tmc) - 1
						}
						totalPortfolioValue += tickerSharesOwned[t] * tmc[tidx].Close
					}

					tickerIdx := -1
					for j, t := range tickers {
						if t == ticker {
							tickerIdx = j
							break
						}
					}
					targetRatio := 0.0
					if tickerIdx >= 0 && tickerIdx < len(allocationRatios) {
						targetRatio = allocationRatios[tickerIdx]
					}
					targetValue := totalPortfolioValue * targetRatio
					targetShares := targetValue / price
					netShares := targetShares - tickerSharesOwned[ticker]
					tickerSharesOwned[ticker] = targetShares

					rebalanceRow = append(rebalanceRow,
						fmt.Sprintf("%.2f", price),
						fmt.Sprintf("%.6f", netShares),
						fmt.Sprintf("%.6f", targetShares),
						fmt.Sprintf("%.2f", netShares*price),
						fmt.Sprintf("%.2f", targetValue),
					)
				} else {
					rebalanceRow = append(rebalanceRow,
						fmt.Sprintf("%.2f", price),
						"0.000000",
						fmt.Sprintf("%.6f", tickerSharesOwned[ticker]),
						"0.00",
						fmt.Sprintf("%.2f", tickerSharesOwned[ticker]*price),
					)
				}
			}
			rebalanceRow = append(rebalanceRow, fmt.Sprintf("%.2f", totalValue), "")
			rebalanceRow = append(rebalanceRow,
				fmt.Sprintf("%.2f", snpPrice),
				"0", "0",
				fmt.Sprintf("%.2f", snpTotal),
			)
			rebalanceRow = append(rebalanceRow, row[len(row)-2], row[len(row)-1])
			csvRows = append(csvRows, strings.Join(rebalanceRow, ","))
		}
	}

	return strings.Join(csvRows, "\n")
}
