"use client";
import { useLearning } from "@/components/learning/provider";
import { travelOf } from "@/lib/travel/state";
export function AnimationSettings() {
  const { state, dispatch, busy } = useLearning();
  const v = travelOf(state).settings;
  return (
    <details className="travel-settings">
      <summary>Саяхат баптаулары</summary>
      <fieldset disabled={busy}>
        <label>
          Анимация
          <select
            aria-label="Анимация"
            value={v.animation}
            onChange={(e) =>
              void dispatch({
                type: "travel-settings",
                settings: {
                  ...v,
                  animation: e.target.value as typeof v.animation,
                },
              })
            }
          >
            <option value="full">Толық</option>
            <option value="light">Жеңіл</option>
            <option value="off">Өшірулі</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={v.sound}
            onChange={(e) =>
              void dispatch({
                type: "travel-settings",
                settings: { ...v, sound: e.target.checked },
              })
            }
          />{" "}
          Сөз дыбыстауына рұқсат
        </label>
        <label>
          <input
            type="checkbox"
            checked={v.follow}
            onChange={(e) =>
              void dispatch({
                type: "travel-settings",
                settings: { ...v, follow: e.target.checked },
              })
            }
          />{" "}
          Камера кейіпкерді қадағаласын
        </label>
        <button
          className="btn ghost"
          onClick={() =>
            void dispatch({
              type: "travel-settings",
              settings: { ...v, introSeen: false },
            })
          }
        >
          Кіріспені қайта көру
        </button>
      </fieldset>
    </details>
  );
}
