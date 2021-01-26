import { EventDispatcher, Listener } from './EventDispatcher';
import { isTouchEvent } from './utils/isTouchEvent';

interface DragEvent {
	type: string;
	// clientX: number;
	// clientY: number;
	dragStartX: number;
	dragStartY: number;
	deltaY: number;
	deltaX: number;
	accumulatedX: number;
	accumulatedY: number;
}

export interface DragStartEvent extends DragEvent {
	type: 'dragstart';
}

export interface DragMoveEvent extends DragEvent {
	type: 'dragmove';
}

export interface DragEndEvent extends DragEvent {
	type: 'dragend';
}

export interface InertiaMoveEvent extends DragEvent {
	type: 'inertiamove';
}

export interface DragCancelEvent {
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

const passiveFalse = { passive: false } as AddEventListenerOptions;

export class InertiaDrag {

	private _isDragging = false;
	private _$el: Element;
	private _eventDispatcher = new EventDispatcher();

	private _friction = 0.85;
	// private _clientX = 0;
	// private _clientY = 0;
	private _dragStartX = 0;
	private _dragStartY = 0;
	private _dragLastX = 0;
	private _dragLastY = 0;
	private _accumulatedX = 0;
	private _accumulatedY = 0;
	private _dragDeltaX = 0;
	private _dragDeltaY = 0;
	private _dragLastDeltaX = 0;
	private _dragLastDeltaY = 0;
	private _velocityX = 0;
	private _velocityY = 0;
	private _requestAnimationFrameId = - 1;

	private _updateVelocity: () => void;
	private _onDragStart: ( event: Event ) => void;
	private _onDragMove: ( event: Event ) => void;
	private _onDragEnd: ( event: Event ) => void;

	constructor( $el: Element ) {

		this._$el = $el;

		this._updateVelocity = ( () => {

			if ( ! this._isDragging && approxZero( this._velocityX ) && approxZero( this._velocityY ) ) return;

			this._requestAnimationFrameId = requestAnimationFrame( this._updateVelocity );

			if ( this._isDragging ) {

				this._dragLastDeltaX = this._dragDeltaX;
				this._dragLastDeltaY = this._dragDeltaY;

				this._dragDeltaX = this._dragLastX;
				this._dragDeltaY = this._dragLastY;

				this._velocityX = ( this._dragDeltaX - this._dragLastDeltaX );
				this._velocityY = ( this._dragDeltaY - this._dragLastDeltaY );

			} else {

				const deltaX = this._velocityX;
				const deltaY = this._velocityY;

				this._velocityX *= this._friction;
				this._velocityY *= this._friction;

				this._dragLastX += deltaX;
				this._dragLastY += deltaY;

				this._accumulatedX += deltaX;
				this._accumulatedY += deltaY;

				this._eventDispatcher.dispatchEvent( {
					type: 'inertiamove',
					// clientX: this._clientX + this._accumulatedX,
					// clientY: this._clientY + this._accumulatedY,
					dragStartX: this._dragStartX,
					dragStartY: this._dragStartY,
					deltaY,
					deltaX,
					accumulatedX: this._accumulatedX,
					accumulatedY: this._accumulatedY,
				} );

			}

		} ).bind( this );

		this._onDragStart = this._handleDragStart.bind( this );
		this._onDragMove = this._handleDragMove.bind( this );
		this._onDragEnd = this._handleDragEnd.bind( this );

		this._$el.addEventListener( 'mousedown', this._onDragStart );
		this._$el.addEventListener( 'touchstart', this._onDragStart );

	}

	set friction( friction: number ) {

		this._friction = friction;

	}

	get isDragging(): boolean {

		return this._isDragging;

	}

	get isInertiaMoving(): boolean {

		if ( this._isDragging ) return false;
		if ( approxZero( this._velocityX ) && approxZero( this._velocityY ) ) return false;

		return true;

	}

	addEventListener<K extends keyof DragEventMap>(
		type: K,
		listener: ( event: DragEventMap[ K ] ) => any,
	): void {

		this._eventDispatcher.addEventListener( type, listener as Listener );

	}

	removeEventListener<K extends keyof DragEventMap>(
		type: K,
		listener: ( event: DragEventMap[ K ] ) => any,
	): void {

		this._eventDispatcher.removeEventListener( type, listener as Listener );

	}

	stop() {

		this._velocityX = 0;
		this._velocityY = 0;
		cancelAnimationFrame( this._requestAnimationFrameId );

	}

	forceDragEnd() {

		document.removeEventListener( 'mousemove', this._onDragMove );
		document.removeEventListener( 'touchmove', this._onDragMove, passiveFalse );
		document.removeEventListener( 'mouseup', this._onDragEnd );
		document.removeEventListener( 'touchend', this._onDragEnd );

		this._isDragging = false;

		this._eventDispatcher.dispatchEvent( {
			type: 'dragcancel',
			dragStartX: this._dragStartX,
			dragStartY: this._dragStartY,
			accumulatedX: this._accumulatedX,
			accumulatedY: this._accumulatedY,
		} );

	}

	destroy() {

		this.stop();
		this.forceDragEnd();
		this._$el.removeEventListener( 'mousedown', this._onDragStart );
		this._$el.removeEventListener( 'touchstart', this._onDragStart );

	}

	private _handleDragStart( event: Event ) {

		event.preventDefault();

		document.removeEventListener( 'mousemove', this._onDragMove );
		document.removeEventListener( 'touchmove', this._onDragMove, passiveFalse );
		document.removeEventListener( 'mouseup', this._onDragEnd );
		document.removeEventListener( 'touchend', this._onDragEnd );

		const _event = isTouchEvent( event )
			? ( event as TouchEvent ).touches[ 0 ]
			: ( event as MouseEvent );

		this._isDragging = true;
		this._accumulatedX = 0;
		this._accumulatedY = 0;
		this._dragStartX = _event.clientX;
		this._dragStartY = _event.clientY;
		this._dragLastX = _event.clientX;
		this._dragLastY = _event.clientY;

		this._eventDispatcher.dispatchEvent( {
			type: 'dragstart',
			// clientX: _event.clientX,
			// clientY: _event.clientY,
			dragStartX: this._dragStartX,
			dragStartY: this._dragStartY,
			deltaY: 0,
			deltaX: 0,
			accumulatedX: this._accumulatedX,
			accumulatedY: this._accumulatedY,
		} );

		this.stop();
		this._updateVelocity();
		document.addEventListener( 'mousemove', this._onDragMove );
		document.addEventListener( 'touchmove', this._onDragMove, passiveFalse );
		document.addEventListener( 'mouseup', this._onDragEnd );
		document.addEventListener( 'touchend', this._onDragEnd );

	}

	private _handleDragMove( event: Event ) {

		event.preventDefault();

		const _event = isTouchEvent( event )
			? ( event as TouchEvent ).touches[ 0 ]
			: ( event as MouseEvent );
		const deltaX = _event.clientX - this._dragLastX;
		const deltaY = _event.clientY - this._dragLastY;
		this._accumulatedX += deltaX;
		this._accumulatedY += deltaY;

		this._dragLastX = _event.clientX;
		this._dragLastY = _event.clientY;

		this._eventDispatcher.dispatchEvent( {
			type: 'dragmove',
			// clientX: _event.clientX,
			// clientY: _event.clientY,
			dragStartX: this._dragStartX,
			dragStartY: this._dragStartY,
			deltaY,
			deltaX,
			accumulatedX: this._accumulatedX,
			accumulatedY: this._accumulatedY,
		} );

	}

	private _handleDragEnd() {

		this.forceDragEnd();

		// const _event = isTouchEvent( event )
		// 	? ( event as TouchEvent ).changedTouches[ 0 ]
		// 	: ( event as MouseEvent );

		this._eventDispatcher.dispatchEvent( {
			type: 'dragend',
			// clientX: _event.clientX,
			// clientY: _event.clientY,
			dragStartX: this._dragStartX,
			dragStartY: this._dragStartY,
			deltaY: 0,
			deltaX: 0,
			accumulatedX: this._accumulatedX,
			accumulatedY: this._accumulatedY,
		} );

		// pass the clientX / Y to the inertia after drag-end
		// this._clientX = _event.clientX;
		// this._clientY = _event.clientY;

	}

}

function approxZero( number: number ): boolean {

	return Math.abs( number ) < 0.001;

}
