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
/** How much bigger or smaller one step of the zoom controls makes the sheet. */
const ZOOM_FACTOR = 1.4;
/** How much bigger a double click makes the sheet, which zooms from its middle. */
const DOUBLE_CLICK_STEP = 0.3;
const ANIMATION_MS = 220;
/**
 * The whole page in the window, never blown up past its true size: a sheet is
 * read at 100% or smaller, and shrinks as far as the window makes it.
 */
const FIT_TO_PAGE = { mode: 'contain', maxScale: 1, animationTime: 0 } as const;
/**
 * Wheel zoom is scaled by how far the wheel turned, so the step is deliberately
 * small: one notch of a mouse wheel moves the scale by about a tenth, while a
 * trackpad's many small events add up to the same thing smoothly.
 */
const WHEEL_STEP = 0.001;
/** Gesture-free zones, as bare class names. */
const LEAVE_ALONE = [STAGE_INTERACTIVE_CLASS];

/**
 * Steps the zoom about the middle of the window, so a click holds on to
 * whatever is being looked at instead of drifting towards a corner. The scale
 * is multiplied rather than added, which keeps every step the same size from
 * any starting point.
 */
function zoomBy(controls: ReactZoomPanPinchRef | null, factor: number) {
    const wrapper = controls?.instance.wrapperComponent;
    if (!controls || !wrapper) return;
    const scale = Math.min(Math.max(controls.state.scale * factor, MIN_SCALE), MAX_SCALE);
    const box = wrapper.getBoundingClientRect();
    void controls.zoomToPoint(
        scale,
        box.left + box.width / 2,
        box.top + box.height / 2,
        ANIMATION_MS,
    );
}

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
            zoomIn: () => zoomBy(controls.current, ZOOM_FACTOR),
            zoomOut: () => zoomBy(controls.current, 1 / ZOOM_FACTOR),
            fitToPage: () =>
                void controls.current?.fitToView({ ...FIT_TO_PAGE, animationTime: ANIMATION_MS }),
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
                void instance.fitToView(FIT_TO_PAGE);
            }}
            onTransform={(_, state) => onScaleChange?.(state.scale)}
            doubleClick={{
                mode: 'zoomIn',
                step: DOUBLE_CLICK_STEP,
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
