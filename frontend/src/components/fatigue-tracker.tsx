import { Coffee } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/SettingsContext";

interface Props {
  reviewCount: number;
}

const FATIGUE_CLICK_THRESHOLD = 20;
const FATIGUE_REVIEW_THRESHOLD = 5;

function sameSpot(positions: { x: number; y: number; time: number }[]): boolean {
  if (positions.length < 8) return false;
  const recent = positions.slice(-8);
  const ox = recent.reduce((s, p) => s + p.x, 0) / recent.length;
  const oy = recent.reduce((s, p) => s + p.y, 0) / recent.length;
  const maxDist = Math.max(...recent.map((p) => Math.hypot(p.x - ox, p.y - oy)));
  const span = recent[recent.length - 1].time - recent[0].time;
  return maxDist < 40 && span < 4000;
}

export function FatigueTracker({ reviewCount }: Props) {
  const { settings } = useSettings();
  const [totalClicks, setTotalClicks] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastDismissRef = useRef(0);
  const clickPositions = useRef<{ x: number; y: number; time: number }[]>([]);

  const checkFatigue = useCallback(() => {
    if (dismissed) return;
    const now = Date.now();
    if (now - lastDismissRef.current < settings.fatigueModalCooldownSeconds * 1000)
      return;
    setShowModal(true);
  }, [dismissed, settings.fatigueModalCooldownSeconds]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (showModal || dismissed) return;
      setTotalClicks((c) => c + 1);
      clickPositions.current.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      });
      if (clickPositions.current.length > 30) clickPositions.current.shift();
      if (
        totalClicks + 1 >= settings.fatigueClickThreshold ||
        sameSpot(clickPositions.current)
      ) {
        checkFatigue();
        setTotalClicks(0);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [checkFatigue, showModal, dismissed, totalClicks, settings.fatigueClickThreshold]);

  useEffect(() => {
    if (dismissed) return;
    if (reviewCount > 0 && reviewCount % settings.fatigueReviewThreshold === 0) {
      checkFatigue();
    }
  }, [reviewCount, checkFatigue, dismissed, settings.fatigueReviewThreshold]);

  const handleDismiss = () => {
    setShowModal(false);
    setDismissed(true);
    lastDismissRef.current = Date.now();
  };

  const handleSnooze = () => {
    setShowModal(false);
    lastDismissRef.current = Date.now();
    setTotalClicks(0);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-xl border bg-background shadow-2xl max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 border-b px-5 py-4">
          <Coffee className="h-6 w-6 text-amber-500" />
          <h3 className="font-bold text-lg">Detekce únavy</h3>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm">
            Všimli jsme si zvýšené aktivity nebo opakovaných kliků na stejné místo.
            Pracujete stále na 100 %?
          </p>
          <p className="text-xs text-muted-foreground">
            Pravidelné přestávky zlepšují kvalitu hodnocení snímků.
          </p>
        </div>
        <div className="border-t px-5 py-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Nezobrazovat
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSnooze}>
              Dát pauzu
            </Button>
            <Button variant="default" size="sm" onClick={() => setShowModal(false)}>
              Jsem v pořádku
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
