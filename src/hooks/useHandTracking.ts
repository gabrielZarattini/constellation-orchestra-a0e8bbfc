import { useEffect, useRef, useState, useCallback } from 'react';

export type GestureType = 'none' | 'open_palm' | 'fist' | 'pinch' | 'point' | 'peace';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  landmarks: HandLandmark[];
  gesture: GestureType;
  indexTip: { x: number; y: number };
  palmCenter: { x: number; y: number };
  pinchDistance: number;
  isActive: boolean;
}

const DEFAULT_HAND: HandData = {
  landmarks: [],
  gesture: 'none',
  indexTip: { x: 0.5, y: 0.5 },
  palmCenter: { x: 0.5, y: 0.5 },
  pinchDistance: 1,
  isActive: false,
};

function distance(a: HandLandmark, b: HandLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function isFingerExtended(landmarks: HandLandmark[], tipIdx: number, pipIdx: number, mcpIdx: number): boolean {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];
  return tip.y < pip.y && pip.y < mcp.y;
}

function detectGesture(landmarks: HandLandmark[]): { gesture: GestureType; pinchDistance: number } {
  if (landmarks.length < 21) return { gesture: 'none', pinchDistance: 1 };

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const indexExtended = isFingerExtended(landmarks, 8, 6, 5);
  const middleExtended = isFingerExtended(landmarks, 12, 10, 9);
  const ringExtended = isFingerExtended(landmarks, 16, 14, 13);
  const pinkyExtended = isFingerExtended(landmarks, 20, 18, 17);

  const pinchDist = distance(thumbTip, indexTip);

  // Pinch: thumb and index close together
  if (pinchDist < 0.06) {
    return { gesture: 'pinch', pinchDistance: pinchDist };
  }

  // Fist: no fingers extended
  if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return { gesture: 'fist', pinchDistance: pinchDist };
  }

  // Peace: index + middle extended, rest closed
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    return { gesture: 'peace', pinchDistance: pinchDist };
  }

  // Point: only index extended
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return { gesture: 'point', pinchDistance: pinchDist };
  }

  // Open palm: all fingers extended
  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return { gesture: 'open_palm', pinchDistance: pinchDist };
  }

  return { gesture: 'none', pinchDistance: pinchDist };
}

export function useHandTracking(enabled: boolean = false) {
  const [handData, setHandData] = useState<HandData>(DEFAULT_HAND);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
    setHandData(DEFAULT_HAND);
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const init = async () => {
      try {
        // Dynamic imports to avoid bundling issues
        const { Hands } = await import('@mediapipe/hands');
        const { Camera } = await import('@mediapipe/camera_utils');

        if (cancelled) return;

        const video = document.createElement('video');
        video.style.display = 'none';
        video.setAttribute('playsinline', '');
        document.body.appendChild(video);
        videoRef.current = video;

        const hands = new Hands({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: any) => {
          if (cancelled) return;

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0] as HandLandmark[];
            const { gesture, pinchDistance } = detectGesture(landmarks);
            const indexTip = landmarks[8];
            const palm = landmarks[0];

            setHandData({
              landmarks,
              gesture,
              indexTip: { x: indexTip.x, y: indexTip.y },
              palmCenter: { x: palm.x, y: palm.y },
              pinchDistance,
              isActive: true,
            });
          } else {
            setHandData(prev => ({ ...prev, isActive: false, gesture: 'none' }));
          }
        });

        handsRef.current = hands;

        const camera = new Camera(video, {
          onFrame: async () => {
            if (!cancelled && handsRef.current) {
              await handsRef.current.send({ image: video });
            }
          },
          width: 640,
          height: 480,
        });

        cameraRef.current = camera;
        await camera.start();

        if (!cancelled) {
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Hand tracking error:', err);
          setError(err.message || 'Failed to start hand tracking');
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      stop();
      if (videoRef.current) {
        videoRef.current.remove();
        videoRef.current = null;
      }
    };
  }, [enabled, stop]);

  return { handData, isLoading, error, stop };
}
