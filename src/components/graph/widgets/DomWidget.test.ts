import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'

import type { LGraphCanvas } from '@/lib/litegraph/src/LGraphCanvas'
import type { LGraphNode } from '@/lib/litegraph/src/LGraphNode'
import type { BaseDOMWidget } from '@/scripts/domWidget'
import type { DomWidgetState } from '@/stores/domWidgetStore'
import { createTestingPinia } from '@pinia/testing'

// Track updatePosition calls from useAbsolutePosition
const mockUpdatePosition = vi.fn()
vi.mock('@/composables/element/useAbsolutePosition', () => ({
  useAbsolutePosition: () => ({
    style: { value: {} },
    updatePosition: mockUpdatePosition
  })
}))

vi.mock('@/composables/element/useDomClipping', () => ({
  useDomClipping: () => ({
    style: { value: {} },
    updateClipPath: vi.fn()
  })
}))

vi.mock('@/renderer/core/canvas/canvasStore', () => ({
  useCanvasStore: () => ({
    canvas: {
      graph: { getNodeById: vi.fn() },
      selected_nodes: {},
      ds: { offset: [0, 0], scale: 1 },
      canvas: document.createElement('canvas')
    } as unknown as LGraphCanvas,
    getCanvas: () =>
      ({
        canvas: document.createElement('canvas'),
        ds: { offset: [0, 0], scale: 1 }
      }) as unknown as LGraphCanvas,
    linearMode: false
  })
}))

vi.mock('@/platform/settings/settingStore', () => ({
  useSettingStore: () => ({
    get: vi.fn(() => false)
  })
}))

function createMockNode(): LGraphNode {
  return {
    id: 1,
    pos: [100, 200],
    size: [240, 120],
    constructor: { nodeData: {} }
  } as unknown as LGraphNode
}

function createMockWidget(node: LGraphNode): BaseDOMWidget<string> {
  return {
    id: 'w1',
    node,
    name: 'test',
    type: 'custom',
    value: '',
    options: {},
    y: 12,
    width: 120,
    computedHeight: 40,
    computedDisabled: false,
    margin: 10,
    isVisible: () => true,
    component: undefined
  } as unknown as BaseDOMWidget<string>
}

function createWidgetState(widget: BaseDOMWidget<string>): DomWidgetState {
  return reactive({
    widget,
    visible: true,
    readonly: false,
    zIndex: 1,
    active: true,
    pos: [100, 200] as [number, number],
    size: [220, 20] as [number, number],
    positionOverride: undefined
  }) as DomWidgetState
}

describe('DomWidget watcher reactivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createTestingPinia({ stubActions: false }))
  })

  it('should update position when pos changes', async () => {
    const node = createMockNode()
    const widget = createMockWidget(node)
    const widgetState = createWidgetState(widget)

    mount(
      {
        template: '<DomWidget :widget-state="widgetState" />',
        components: {
          DomWidget: (await import('@/components/graph/widgets/DomWidget.vue'))
            .default
        },
        setup: () => ({ widgetState })
      },
      { global: { stubs: { component: true } } }
    )

    mockUpdatePosition.mockClear()
    widgetState.pos = [300, 400]
    await nextTick()

    expect(mockUpdatePosition).toHaveBeenCalled()
  })

  it('should update position when size changes', async () => {
    const node = createMockNode()
    const widget = createMockWidget(node)
    const widgetState = createWidgetState(widget)

    mount(
      {
        template: '<DomWidget :widget-state="widgetState" />',
        components: {
          DomWidget: (await import('@/components/graph/widgets/DomWidget.vue'))
            .default
        },
        setup: () => ({ widgetState })
      },
      { global: { stubs: { component: true } } }
    )

    mockUpdatePosition.mockClear()
    widgetState.size = [400, 60]
    await nextTick()

    expect(mockUpdatePosition).toHaveBeenCalled()
  })

  it('should update style when zIndex changes', async () => {
    const node = createMockNode()
    const widget = createMockWidget(node)
    const widgetState = createWidgetState(widget)

    const wrapper = mount(
      {
        template: '<DomWidget :widget-state="widgetState" />',
        components: {
          DomWidget: (await import('@/components/graph/widgets/DomWidget.vue'))
            .default
        },
        setup: () => ({ widgetState })
      },
      { global: { stubs: { component: true } } }
    )

    widgetState.zIndex = 99
    await nextTick()

    const domWidget = wrapper.find('.dom-widget')
    expect(domWidget.attributes('style')).toContain('z-index: 99')
  })

  it('should update pointer-events when readonly changes', async () => {
    const node = createMockNode()
    const widget = createMockWidget(node)
    const widgetState = createWidgetState(widget)

    const wrapper = mount(
      {
        template: '<DomWidget :widget-state="widgetState" />',
        components: {
          DomWidget: (await import('@/components/graph/widgets/DomWidget.vue'))
            .default
        },
        setup: () => ({ widgetState })
      },
      { global: { stubs: { component: true } } }
    )

    widgetState.readonly = true
    await nextTick()

    const domWidget = wrapper.find('.dom-widget')
    expect(domWidget.attributes('style')).toContain('pointer-events: none')
  })
})
