"use client";

import { useEffect, useMemo, useRef } from "react";
import { Color, Vector3 } from "three";
import ThreeGlobe from "three-globe";
import { Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "@/data/globe.json";

/* -------------------------------------------------- */
/* R3F EXTENSION – SAFE FOR TURBOPACK & HMR            */
/* -------------------------------------------------- */

declare module "@react-three/fiber" {
  interface ThreeElements {
    threeGlobe: any;
  }
}

function ExtendOnce() {
  const done = useRef(false);

  if (!done.current) {
    extend({ ThreeGlobe });
    done.current = true;
  }

  return null;
}

/* -------------------------------------------------- */
/* TYPES                                              */
/* -------------------------------------------------- */

type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

/* -------------------------------------------------- */
/* CONSTANTS                                          */
/* -------------------------------------------------- */

const CAMERA_Z = 300;
const RING_PROPAGATION_SPEED = 3;

/* -------------------------------------------------- */
/* GLOBE                                              */
/* -------------------------------------------------- */

function Globe({ globeConfig, data }: WorldProps) {
  const globeRef = useRef<ThreeGlobe | null>(null);

  const config = {
    pointSize: 1,
    atmosphereColor: "#ffffff",
    showAtmosphere: true,
    atmosphereAltitude: 0.1,
    polygonColor: "rgba(255,255,255,0.7)",
    globeColor: "#1d072e",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ...globeConfig,
  };

  const points = useMemo(() => {
    const pts: any[] = [];
    data.forEach((arc) => {
      pts.push({
        lat: arc.startLat,
        lng: arc.startLng,
        color: arc.color,
        size: config.pointSize,
      });
      pts.push({
        lat: arc.endLat,
        lng: arc.endLng,
        color: arc.color,
        size: config.pointSize,
      });
    });

    return pts.filter(
      (v, i, a) =>
        a.findIndex(
          (v2) => v2.lat === v.lat && v2.lng === v.lng
        ) === i
    );
  }, [data, config.pointSize]);

  /* ---------- SETUP ---------- */

  useEffect(() => {
    if (!globeRef.current) return;

    const mat = globeRef.current.globeMaterial() as any;
    mat.color = new Color(config.globeColor);
    mat.emissive = new Color(config.emissive);
    mat.emissiveIntensity = config.emissiveIntensity;
    mat.shininess = config.shininess;

    globeRef.current
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.7)
      .hexPolygonColor(() => config.polygonColor)
      .showAtmosphere(config.showAtmosphere)
      .atmosphereColor(config.atmosphereColor)
      .atmosphereAltitude(config.atmosphereAltitude);

    globeRef.current
      .arcsData(data)
      .arcStartLat((d: any) => d.startLat)
      .arcStartLng((d: any) => d.startLng)
      .arcEndLat((d: any) => d.endLat)
      .arcEndLng((d: any) => d.endLng)
      .arcColor((d: any) => d.color)
      .arcAltitude((d: any) => d.arcAlt)
      .arcStroke(() => [0.28, 0.3, 0.32][Math.floor(Math.random() * 3)])
      .arcDashLength(config.arcLength)
      .arcDashGap(15)
      .arcDashInitialGap((d: any) => d.order)
      .arcDashAnimateTime(config.arcTime);

    globeRef.current
      .pointsData(points)
      .pointColor((d: any) => d.color)
      .pointRadius(2)
      .pointsMerge(true);

    globeRef.current
      .ringsData([])
      .ringColor(() => config.polygonColor)
      .ringMaxRadius(config.maxRings)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod(
        (config.arcTime * config.arcLength) / config.rings
      );
  }, [config, data, points]);

  /* ---------- RINGS ---------- */

  useEffect(() => {
    if (!globeRef.current) return;

    const id = setInterval(() => {
      const pick = genRandomNumbers(
        0,
        data.length,
        Math.floor((data.length * 4) / 5)
      );

      globeRef.current!.ringsData(
        data
          .filter((_, i) => pick.includes(i))
          .map((d) => ({
            lat: d.startLat,
            lng: d.startLng,
            color: d.color,
          }))
      );
    }, 2000);

    return () => clearInterval(id);
  }, [data]);

  return <threeGlobe ref={globeRef} />;
}

/* -------------------------------------------------- */
/* WORLD                                              */
/* -------------------------------------------------- */

export function World(props: WorldProps) {
  const { globeConfig } = props;

  return (
    <Canvas
      camera={{ fov: 50, position: [0, 0, CAMERA_Z] }}
      dpr={typeof window !== "undefined" ? window.devicePixelRatio : 1}
      gl={{ alpha: true }}
    >
      <ExtendOnce />

      <fog attach="fog" args={[0xffffff, 400, 2000]} />

      <ambientLight color={globeConfig.ambientLight} intensity={0.6} />

      <directionalLight
        color={globeConfig.directionalLeftLight}
        position={new Vector3(-400, 100, 400)}
      />

      <directionalLight
        color={globeConfig.directionalTopLight}
        position={new Vector3(-200, 500, 200)}
      />

      <pointLight
        color={globeConfig.pointLight}
        position={new Vector3(-200, 500, 200)}
        intensity={0.8}
      />

      <Globe {...props} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={globeConfig.autoRotate ?? true}
        autoRotateSpeed={globeConfig.autoRotateSpeed ?? 1}
        minDistance={CAMERA_Z}
        maxDistance={CAMERA_Z}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI - Math.PI / 3}
      />
    </Canvas>
  );
}

/* -------------------------------------------------- */
/* UTILS                                              */
/* -------------------------------------------------- */

function genRandomNumbers(min: number, max: number, count: number) {
  const arr: number[] = [];
  while (arr.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min;
    if (!arr.includes(r)) arr.push(r);
  }
  return arr;
}
