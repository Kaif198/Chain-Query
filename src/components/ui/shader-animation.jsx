"use client"

import React, { useEffect, useRef } from "react"
import * as THREE from "three"

export function ShaderAnimation() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Vertex shader
    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    // Fragment shader
    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform vec2 origin;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy - origin) * 2.0 / min(resolution.x, resolution.y);
        float t = time*0.05;
        float lineWidth = 0.002;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i=0; i < 5; i++){
            color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
          }
        }
        
        gl_FragColor = vec4(color[0],color[1],color[2],1.0);
      }
    `

    // Initialize Three.js scene
    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      origin: { type: "v2", value: new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2) }
    }

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      alpha: false,
      powerPreference: "high-performance"
    })
    
    // Performance optimization: cap pixel ratio at 2
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    container.appendChild(renderer.domElement)

    // Handle resize with ResizeObserver for accurate containment dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;
        renderer.setSize(width, height);
        uniforms.resolution.value.x = width;
        uniforms.resolution.value.y = height;
      }
    });

    // Start observing the container
    resizeObserver.observe(container);

    // Initial manual resize to ensure we catch the very first frame
    if (container.clientWidth > 0 && container.clientHeight > 0) {
      renderer.setSize(container.clientWidth, container.clientHeight);
      uniforms.resolution.value.x = container.clientWidth;
      uniforms.resolution.value.y = container.clientHeight;
    }

    // Handle explicit window resize as a fallback
    const onWindowResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height);
      uniforms.resolution.value.x = width;
      uniforms.resolution.value.y = height;
    };
    
    window.addEventListener("resize", onWindowResize, false);

    // Snap origin to the "Intelligence" word before first render
    let firstFrame = true;

    // Animation loop
    const animate = () => {
      // Pause animation if window is not visible
      if (document.hidden) {
        sceneRef.current.animationId = requestAnimationFrame(animate)
        return
      }

      // Track the subtitle element to center the shader there
      const titleEl = document.getElementById('landing-title');
      if (titleEl) {
        const rect = titleEl.getBoundingClientRect();
        // Center of the title element
        const centerX = rect.right - 40;
        // WebGL Y coordinate points up, so we invert it based on viewport
        const centerY = window.innerHeight - (rect.top + rect.height / 2);

        if (firstFrame) {
          // Snap immediately on the first frame so animation starts from the word
          uniforms.origin.value.x = centerX;
          uniforms.origin.value.y = centerY;
          firstFrame = false;
        } else {
          uniforms.origin.value.x += (centerX - uniforms.origin.value.x) * 0.1;
          uniforms.origin.value.y += (centerY - uniforms.origin.value.y) * 0.1;
        }
      } else {
        // Fallback to center screen
        uniforms.origin.value.x += ((window.innerWidth / 2) - uniforms.origin.value.x) * 0.1;
        uniforms.origin.value.y += ((window.innerHeight / 2) - uniforms.origin.value.y) * 0.1;
      }

      const animationId = requestAnimationFrame(animate)
      uniforms.time.value += 0.05
      renderer.render(scene, camera)

      if (sceneRef.current) {
        sceneRef.current.animationId = animationId
      }
    }

    // Store scene references for cleanup
    sceneRef.current = {
      camera,
      scene,
      renderer,
      uniforms,
      animationId: 0,
      geometry,
      material
    }

    // Start animation
    animate()

    // Cleanup function
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", onWindowResize);

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)

        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement)
        }

        // Dispose all GPU assets
        sceneRef.current.renderer.dispose()
        sceneRef.current.geometry.dispose()
        sceneRef.current.material.dispose()
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{
        background: "#000",
        overflow: "hidden",
      }}
    />
  )
}
