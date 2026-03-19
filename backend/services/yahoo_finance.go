package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type ChartResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				Symbol    string `json:"symbol"`
				LongName  string `json:"longName"`
				ShortName string `json:"shortName"`
			} `json:"meta"`
			Timestamp  []int64 `json:"timestamp"`
			Indicators struct {
				Quote []struct {
					Close []interface{} `json:"close"`
				} `json:"quote"`
			} `json:"indicators"`
		} `json:"result"`
		Error *struct {
			Code        string `json:"code"`
			Description string `json:"description"`
		} `json:"error"`
	} `json:"chart"`
}

type Quote struct {
	Date  time.Time
	Close float64
}

type MonthlyClose struct {
	Month string  `json:"month" bson:"month"`
	Date  string  `json:"date" bson:"date"`
	Close float64 `json:"close" bson:"close"`
}

var httpClient = &http.Client{Timeout: 30 * time.Second}

func FetchChartData(ticker string, startDate, endDate time.Time) ([]Quote, *ChartResponse, error) {
	url := fmt.Sprintf(
		"https://query1.finance.yahoo.com/v8/finance/chart/%s?period1=%d&period2=%d&interval=1d",
		ticker,
		startDate.Unix(),
		endDate.Unix(),
	)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch data for %s: %w", ticker, err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, err
	}

	var chartResp ChartResponse
	if err := json.Unmarshal(body, &chartResp); err != nil {
		return nil, nil, fmt.Errorf("failed to parse response for %s: %w", ticker, err)
	}

	if chartResp.Chart.Error != nil {
		return nil, nil, fmt.Errorf("Yahoo Finance error for %s: %s", ticker, chartResp.Chart.Error.Description)
	}

	if len(chartResp.Chart.Result) == 0 {
		return nil, nil, fmt.Errorf("no data available for ticker %s", ticker)
	}

	result := chartResp.Chart.Result[0]
	if len(result.Timestamp) == 0 || len(result.Indicators.Quote) == 0 {
		return nil, nil, fmt.Errorf("no data available for ticker %s", ticker)
	}

	closes := result.Indicators.Quote[0].Close
	var quotes []Quote
	for i, ts := range result.Timestamp {
		if i >= len(closes) || closes[i] == nil {
			continue
		}
		var closeVal float64
		switch v := closes[i].(type) {
		case float64:
			closeVal = v
		case json.Number:
			closeVal, _ = v.Float64()
		default:
			continue
		}
		if closeVal == 0 {
			continue
		}
		quotes = append(quotes, Quote{
			Date:  time.Unix(ts, 0).UTC(),
			Close: closeVal,
		})
	}

	return quotes, &chartResp, nil
}

// ExtractMonthlyCloses takes the first available trading day of each month.
// Quotes must be sorted chronologically (oldest first), which Yahoo Finance provides by default.
// Unlike the old "day <= 4" heuristic, this handles months where the first trading day
// falls on the 5th or later (holidays, weekends) without silently dropping data.
func ExtractMonthlyCloses(quotes []Quote) []MonthlyClose {
	seenMonths := make(map[string]bool)
	var monthlyCloses []MonthlyClose

	for _, q := range quotes {
		monthKey := fmt.Sprintf("%d-%02d", q.Date.Year(), q.Date.Month())
		if !seenMonths[monthKey] {
			seenMonths[monthKey] = true
			monthlyCloses = append(monthlyCloses, MonthlyClose{
				Month: monthKey,
				Date:  q.Date.Format("2006-01-02"),
				Close: q.Close,
			})
		}
	}

	return monthlyCloses
}

func SearchTicker(query string) map[string]interface{} {
	endDate := time.Now()
	startDate := endDate.AddDate(0, 0, -7)

	_, chartResp, err := FetchChartData(query, startDate, endDate)
	if err != nil || chartResp == nil || len(chartResp.Chart.Result) == 0 {
		return map[string]interface{}{
			"found":  false,
			"ticker": query,
			"name":   nil,
		}
	}

	meta := chartResp.Chart.Result[0].Meta
	name := meta.LongName
	if name == "" {
		name = meta.ShortName
	}
	if name == "" {
		name = meta.Symbol
	}

	return map[string]interface{}{
		"found":  true,
		"ticker": meta.Symbol,
		"name":   name,
	}
}
