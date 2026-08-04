import * as echarts from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Only the pieces the dashboard actually draws are registered. Importing the
// `echarts` barrel instead would pull every chart type and component (~1 MB)
// into the lazy dashboard chunk.
echarts.use([BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

export { echarts };
