// AstroCoreEntryPoint.ts
import global from './Global.js'
import AstroSphere from './AstroSphere.js'
import HiPSDescriptor from './model/hips/HiPSDescriptor.js'

type GL2WithViewport = WebGL2RenderingContext & {
  viewportWidth: number
  viewportHeight: number
}

export default class AstroCore {
  private astroSphere!: AstroSphere
  private canvas!: HTMLCanvasElement
  private webgl!: GL2WithViewport
  private rafId: number | null = null

  constructor() {
    this.init()
  }

  
  activateHiPS(hipsDescriptor: HiPSDescriptor): void {
    this.astroSphere.activateHiPS(hipsDescriptor)
  }

  init(): void {
    console.log('init webgl')

    const c = document.getElementById('canvas-ab')
    if (!(c instanceof HTMLCanvasElement)) {
      throw new Error("Element with id 'canvas-ab' is not a canvas.")
    }
    this.canvas = c

    const gl = this.canvas.getContext('webgl2', { alpha: false })
    if (!gl) {
      alert('Could not initialise WebGL, sorry :-(')
      throw new Error('WebGL2 not available')
    }

    // Extend with custom fields used elsewhere
    this.webgl = gl as GL2WithViewport
    this.webgl.viewportWidth = this.canvas.width
    this.webgl.viewportHeight = this.canvas.height

    try {
      // 1/255 = 0.00392156862
      this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7)
    } catch (e) {
      console.log('Error instantiating WebGL context')
    }

    this.initListeners()
    ;(global as any).gl = this.webgl
    this.astroSphere = new AstroSphere(this.canvas, this.webgl)
  }

  private initListeners(): void {
    console.log('inside initListeners')

    const resizeCanvas = () => {
      console.log('[resizeCanvas]')
      const newWidth = window.innerWidth - 3
      const newHeight = window.innerHeight - 3

      this.canvas.width = newWidth
      this.canvas.height = newHeight

      this.webgl.viewportWidth = this.canvas.width
      this.webgl.viewportHeight = this.canvas.height
      this.webgl.viewport(0, 0, this.canvas.width, this.canvas.height)
    }

    const handleContextLost = (event: Event) => {
      console.log('[handleContextLost]')
      event.preventDefault()
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId)
        this.rafId = null
      }
    }

    const handleContextRestored = (_event: Event) => {
      console.log('[handleContextRestored]')
      this.webgl.viewportWidth = this.canvas.width
      this.webgl.viewportHeight = this.canvas.height
      this.webgl.clearColor(0 * 0.00392156862, 16 * 0.00392156862, 50 * 0.00392156862, 0.7)
      this.webgl.enable(this.webgl.DEPTH_TEST)
      this.rafId = requestAnimationFrame(() => this.tick())
    }

    window.addEventListener('resize', resizeCanvas)
    this.canvas.addEventListener('webglcontextlost', handleContextLost as EventListener, false)
    this.canvas.addEventListener('webglcontextrestored', handleContextRestored as EventListener, false)
    resizeCanvas()
  }

  run(): number {
    return this.tick()
  }

  private tick(): number {
    this.drawScene()
    this.rafId = requestAnimationFrame(() => this.tick())
    return this.rafId
  }

  private drawScene(): void {
    this.astroSphere.draw(this.canvas)
  }

}