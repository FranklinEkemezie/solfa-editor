import { forwardRef, useImperativeHandle, useRef, type ReactNode } from 'react';
import {
    TransformComponent,
    TransformWrapper,
    type ReactZoomPanPinchRef,
} from 'react-zoom-pan-pinch';

/**
 * Marks a region the stage must leave alone.
 *
 * The stage would otherwise treat a drag across the title block as a pan and a
 * double click on it as a zoom, which fights with selecting text in the fields
 * there. Anything carrying this class — or nested inside something that does —
 * keeps its own pointer gestures.
 *
 * The library expects a bare class name here: it builds the selector itself, so
 * a leading dot would produce `..name` and throw on every gesture.
 */
export const STAGE_INTERACTIVE_CLASS = 'stage-interactive';

/** What the tool rail drives on the stage. */
export type ScoreStageHandle = {
    zoomIn: () => void;
    zoomOut: () => void;
    fitToPage: () => void;
    actualSize: () => void;
};

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.5;
/** How much of the way to the next scale a click on a zoom button moves. */
const ZOOM_STEP = 0.35;
const ANIMATION_MS = 220;
/** The opening view: one page to the height of the window, never blown up. */
const OPENING_FIT = { mode: 'contain', minScale: 0.45, maxScale: 1, animationTime: 0 } as const;
/**
 * Wheel zoom is scaled by how far the wheel turned, so the step is deliberately
 * small: one notch of a mouse wheel moves the scale by about a tenth, while a
 * trackpad's many small events add up to the same thing smoothly.
 */
const WHEEL_STEP = 0.001;
/** Gesture-free zones, as bare class names. */
const LEAVE_ALONE = [STAGE_INTERACTIVE_CLASS];

export const ScoreStage = forwardRef<
    ScoreStageHandle,
    {
        children: ReactNode;
        /** Reports the scale as it changes, so a control can show it. */
        onScaleChange?: (scale: number) => void;
    }
>(function ScoreStage({ children, onScaleChange }, ref) {
    const controls = useRef<ReactZoomPanPinchRef | null>(null);

    useImperativeHandle(
        ref,
        () => ({
            zoomIn: () => void controls.current?.zoomIn(ZOOM_STEP, ANIMATION_MS),
            zoomOut: () => void controls.current?.zoomOut(ZOOM_STEP, ANIMATION_MS),
            fitToPage: () =>
                void controls.current?.fitToView({ ...OPENING_FIT, animationTime: ANIMATION_MS }),
            actualSize: () => void controls.current?.centerView(1, ANIMATION_MS),
        }),
        [],
    );

    return (
        <TransformWrapper
            minScale={MIN_SCALE}
            maxScale={MAX_SCALE}
            limitToBounds={false}
            onInit={(instance) => {
                controls.current = instance;
                void instance.fitToView(OPENING_FIT);
            }}
            onTransform={(_, state) => onScaleChange?.(state.scale)}
            doubleClick={{
                mode: 'zoomIn',
                step: ZOOM_STEP,
                animationTime: ANIMATION_MS,
                excluded: LEAVE_ALONE,
            }}
            wheel={{ step: WHEEL_STEP, excluded: LEAVE_ALONE }}
            pinch={{ excluded: LEAVE_ALONE }}
            trackPadPanning={{ excluded: LEAVE_ALONE }}
            panning={{
                allowLeftClickPan: true,
                allowMiddleClickPan: true,
                allowRightClickPan: false,
                excluded: LEAVE_ALONE,
            }}
        >
            <TransformComponent
                wrapperClass="score-stage-viewport"
                contentClass="score-stage-content"
            >
                <div className="score-stage-sheets">{children}</div>
            </TransformComponent>
        </TransformWrapper>
    );
});
