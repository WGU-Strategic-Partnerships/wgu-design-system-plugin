# WGU Data Visualization

## Principles

WGU charts should be clean, scannable, and grounded in evidence. The brand voice is "evidence-backed" and data viz is one of the most direct expressions of that voice.

- **Clarity over cleverness.** Pick the chart type that makes the comparison easiest. Bar for category comparison. Line for trend over time. Scatter for correlation. Pie only for whole-of-100 with three or fewer slices.
- **Direct labels** beat legends when there is room.
- **Annotation** earns its place. Call out the one or two insights that matter.
- **Round responsibly.** Use whole numbers in display where possible. Document precision in source notes if needed.

## Color usage in charts

WGU's data viz palette draws from the brand palette in a specific order:

1. **WGU Blue (#002855).** First series, default emphasis.
2. **Medium Blue (#0070F0).** Second series.
3. **Sky Blue (#46B1EF).** Third series.
4. **Lime Green (#97E152).** Fourth series, or single-series accent.
5. **Grey (#A7A7A7).** "Other" or comparison baseline.
6. **Midnight (#001731).** For dark-on-dark when needed.

Avoid using six or more series. If you have more than five categories, group the smallest into "Other" or split into multiple charts.

## Type in charts

- **Chart title.** h4 (Futura PT Medium 26px) or smaller depending on layout.
- **Axis labels.** 14px Futura PT Book.
- **Tick labels.** 12 to 14px Futura PT Book, Grey.
- **Data labels.** 14px Futura PT Medium, color-matched to the series.
- **Source attribution.** 12px Futura PT Light Italic, Grey, below the chart.

## Numerals

In stat-style infographics where a single big number is the focal point, use **Newsreader (Rocky substitute)**.

```css
.numeral {
  font-family: 'Newsreader', 'Rocky', Georgia, serif;
  font-weight: 600;
  font-variant-numeric: lining-nums;
}
```

In standard chart axes, use Futura PT Book.

## Chart elements

- **Gridlines.** Light Grey (#F1F1F1), 1px. Horizontal only on bar and column charts.
- **Axis lines.** WGU Blue at 30% opacity for subtle structure.
- **Bars and lines.** Solid brand colors. No textures, no gradients on data marks.
- **Hover state.** Bar or line lifts slightly, value tooltip appears.

## Recommended chart libraries

- **Recharts** for React projects.
- **Chart.js** for vanilla JS.
- **D3** for custom or unusual visualizations.

The `wgu-design` plugin includes brand-themed examples for each.

## Accessibility

- **Color is not the only encoding.** Use shape, pattern, or label in addition to color to differentiate series.
- **Alt text** describes the data, not just the chart type. Example: "Bar chart showing 75% of WGU graduates report salary increase within two years, compared to 60% national average."
- **Tabular alternative.** Consider providing a data table beneath complex visualizations.

## Common chart patterns

### Single big number

A hero stat with `--font-numeral` (Newsreader) and a one-line supporting label.

```
[ 75+ ]
industry-aligned programs
```

### Three-stat row

Three single-big-number cards in a row. Equal heights. Top-aligned numerals.

### Bar chart

Categorical comparison. WGU Blue bars on a white surface. Direct value labels at the end of each bar.

### Line chart

Trend over time. WGU Blue line, 2px stroke. Optional second series in Medium Blue. Markers at data points. X-axis with year labels, Y-axis with metric labels.

### Donut chart

Use only for two- or three-segment whole-of-100 comparisons. Display the focal value as a centered numeral in Newsreader.

## What not to do

- Don't pair Lime Green and Sky Blue as adjacent series (they vibrate).
- Don't use 3D chart effects.
- Don't apply gradients to bars or pie slices.
- Don't truncate axes to exaggerate differences.
- Don't use pie charts for more than three slices.
- Don't show a stat without a clear source attribution.
