'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Stars() {
  const starsRef = useRef<THREE.Points>(null)
  
  const stars = useMemo(() => {
    const count = 1000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Create stars in a sphere around the camera
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos((Math.random() * 2) - 1)
      const radius = 15 + Math.random() * 10
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      // White to cyan to purple colors
      const rand = Math.random()
      if (rand > 0.7) {
        colors[i * 3] = 1
        colors[i * 3 + 1] = 1
        colors[i * 3 + 2] = 1
      } else if (rand > 0.4) {
        colors[i * 3] = 0
        colors[i * 3 + 1] = 0.8
        colors[i * 3 + 2] = 1
      } else {
        colors[i * 3] = 0.6
        colors[i * 3 + 1] = 0.3
        colors[i * 3 + 2] = 1
      }
      
      sizes[i] = Math.random() * 0.05 + 0.02
    }
    
    return { positions, colors, sizes }
  }, [])

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.01
      starsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.05
    }
  })

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[stars.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[stars.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[stars.sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function ShootingStars() {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh
        mesh.position.x += 0.1
        mesh.position.y -= 0.05
        
        if (mesh.position.x > 15) {
          mesh.position.x = -15
          mesh.position.y = 10
          mesh.position.z = -10 + Math.random() * 5
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[-15 + i * 6, 10, -10 + i * 2]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Moon() {
  const moonRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (moonRef.current) {
      moonRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <mesh ref={moonRef} position={[8, 5, -15]}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial
        color="#e0e7ff"
        emissive="#a5b4fc"
        emissiveIntensity={0.5}
        roughness={0.8}
      />
    </mesh>
  )
}

function Nebula() {
  const nebulaRef = useRef<THREE.Points>(null)
  
  const nebula = useMemo(() => {
    const count = 300
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 8
      
      positions[i * 3] = Math.cos(angle) * radius - 5
      positions[i * 3 + 1] = Math.sin(angle) * radius + 2
      positions[i * 3 + 2] = -20 + Math.random() * 5
      
      colors[i * 3] = 0.4 + Math.random() * 0.3
      colors[i * 3 + 1] = 0.2 + Math.random() * 0.4
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1
    }
    
    return { positions, colors }
  }, [])

  useFrame((state) => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.z = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={nebulaRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[nebula.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[nebula.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function ProfileBackground3D() {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 opacity-50">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        className="w-full h-full"
      >
        <color attach="background" args={['#000814']} />
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={0.3} color="#4f46e5" />
        
        <Stars />
        <ShootingStars />
        <Moon />
        <Nebula />
      </Canvas>
    </div>
  )
}
