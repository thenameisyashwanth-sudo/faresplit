import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function ThreeBackground() {
  const mountRef = useRef(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 30

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      container.appendChild(renderer.domElement)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[FareSplit] WebGL disabled or failed to initialize:', err)
      return
    }

    // Create particles geometry
    const particleCount = 120
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const scales = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      scales[i] = Math.random() * 0.8 + 0.2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // Particle material
    const material = new THREE.PointsMaterial({
      color: new THREE.Color('#818cf8'),
      size: 0.8,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    })

    const particleSystem = new THREE.Points(geometry, material)
    scene.add(particleSystem)

    // Floating Mesh 1: Wireframe Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(6, 1)
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    })
    const icoMesh = new THREE.Mesh(icoGeo, icoMat)
    icoMesh.position.set(-18, 10, -10)
    scene.add(icoMesh)

    // Floating Mesh 2: Torus Knot
    const torusGeo = new THREE.TorusKnotGeometry(4, 1.2, 64, 16)
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    })
    const torusMesh = new THREE.Mesh(torusGeo, torusMat)
    torusMesh.position.set(20, -12, -15)
    scene.add(torusMesh)

    // Mouse movement tracking
    let mouseX = 0
    let mouseY = 0

    const handleMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Animation Loop
    let animationFrameId
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      // Rotate meshes gently
      icoMesh.rotation.x = elapsedTime * 0.1
      icoMesh.rotation.y = elapsedTime * 0.15
      torusMesh.rotation.x = -elapsedTime * 0.12
      torusMesh.rotation.y = elapsedTime * 0.18

      // Rotate particle system slowly
      particleSystem.rotation.y = elapsedTime * 0.03

      // Smooth camera sway with mouse
      camera.position.x += (mouseX * 3 - camera.position.x) * 0.03
      camera.position.y += (-mouseY * 3 - camera.position.y) * 0.03
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }

    animate()

    // Handle Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (renderer && container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      geometry?.dispose()
      material?.dispose()
      icoGeo?.dispose()
      icoMat?.dispose()
      torusGeo?.dispose()
      torusMat?.dispose()
      renderer?.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-0 opacity-80 transition-opacity duration-1000"
    />
  )
}
