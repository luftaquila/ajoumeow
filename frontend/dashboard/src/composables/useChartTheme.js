import { computed } from 'vue'
import { useTheme } from '../../../shared/composables/useTheme.js'

export function useChartTheme() {
  const { isDark } = useTheme()

  const textColor = computed(() => isDark.value ? '#e2e8f0' : '#334155')
  const gridColor = computed(() => isDark.value ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)')
  const tooltipBg = computed(() => isDark.value ? '#1e293b' : '#ffffff')

  const courseColors = {
    '1코스': '#F43F5E',
    '2코스': '#3B82F6',
    '3코스': '#8B5CF6',
  }

  const courseColorList = ['#F43F5E', '#3B82F6', '#8B5CF6', '#F59E0B', '#22C55E', '#06B6D4']

  return { isDark, textColor, gridColor, tooltipBg, courseColors, courseColorList }
}
