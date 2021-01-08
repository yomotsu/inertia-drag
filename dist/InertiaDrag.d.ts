interface DragEvent {
    type: string;
    dragStartX: number;
    dragStartY: number;
    deltaY: number;
    deltaX: number;
    accumulatedX: number;
    accumulatedY: number;
}
interface DragStartEvent extends DragEvent {
    type: 'dragstart';
}
interface DragMoveEvent extends DragEvent {
    type: 'dragmove';
}
interface DragEndEvent extends DragEvent {
    type: 'dragend';
}
interface InertiaMoveEvent extends DragEvent {
    type: 'inertiamove';
}
interface DragCancelEvent {
    type: 'dragcancel';
    dragStartX: number;
    dragStartY: number;
    accumulatedX: number;
    accumulatedY: number;
}
interface DragEventMap {
    dragstart: DragStartEvent;
    dragmove: DragMoveEvent;
    dragend: DragEndEvent;
    dragcancel: DragCancelEvent;
    inertiamove: InertiaMoveEvent;
}
export declare class InertiaDrag {
    private _isDragging;
    private _$el;
    private _eventDispatcher;
    private _friction;
    private _dragStartX;
    private _dragStartY;
    private _dragLastX;
    private _dragLastY;
    private _accumulatedX;
    private _accumulatedY;
    private _dragDeltaX;
    private _dragDeltaY;
    private _dragLastDeltaX;
    private _dragLastDeltaY;
    private _velocityX;
    private _velocityY;
    private _requestAnimationFrameId;
    private _updateVelocity;
    private _onDragStart;
    private _onDragMove;
    private _onDragEnd;
    constructor($el: Element);
    friction: number;
    readonly isDragging: boolean;
    readonly isInertiaMoving: boolean;
    addEventListener<K extends keyof DragEventMap>(type: K, listener: (event: DragEventMap[K]) => any): void;
    removeEventListener<K extends keyof DragEventMap>(type: K, listener: (event: DragEventMap[K]) => any): void;
    stop(): void;
    forceDragEnd(): void;
    destroy(): void;
    private _handleDragStart;
    private _handleDragMove;
    private _handleDragEnd;
}
export {};
