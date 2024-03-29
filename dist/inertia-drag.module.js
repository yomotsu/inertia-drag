/*!
 * inertia-drag
 * https://github.com/yomotsu/inertia-drag
 * (c) 2020 @yomotsu
 * Released under the MIT License.
 */
class EventDispatcher {
    constructor() {
        this._listeners = {};
    }
    addEventListener(type, listener) {
        const listeners = this._listeners;
        if (listeners[type] === undefined)
            listeners[type] = [];
        if (listeners[type].indexOf(listener) === -1)
            listeners[type].push(listener);
    }
    removeEventListener(type, listener) {
        const listeners = this._listeners;
        const listenerArray = listeners[type];
        if (listenerArray !== undefined) {
            const index = listenerArray.indexOf(listener);
            if (index !== -1)
                listenerArray.splice(index, 1);
        }
    }
    dispatchEvent(event) {
        const listeners = this._listeners;
        const listenerArray = listeners[event.type];
        if (listenerArray !== undefined) {
            event.target = this;
            const array = listenerArray.slice(0);
            for (let i = 0, l = array.length; i < l; i++) {
                array[i].call(this, event);
            }
        }
    }
}

function isTouchEvent(event) {
    return 'TouchEvent' in window && event instanceof TouchEvent;
}

const passiveFalse = { passive: false };
class InertiaDrag {
    constructor($el) {
        this._isDragging = false;
        this._eventDispatcher = new EventDispatcher();
        this._friction = 0.15;
        this._dragStartX = 0;
        this._dragStartY = 0;
        this._dragLastX = 0;
        this._dragLastY = 0;
        this._accumulatedX = 0;
        this._accumulatedY = 0;
        this._dragDeltaX = 0;
        this._dragDeltaY = 0;
        this._dragLastDeltaX = 0;
        this._dragLastDeltaY = 0;
        this._velocityX = 0;
        this._velocityY = 0;
        this._requestAnimationFrameId = -1;
        this._$el = $el;
        this._updateVelocity = (() => {
            if (!this._isDragging && approxZero(this._velocityX) && approxZero(this._velocityY))
                return;
            this._requestAnimationFrameId = requestAnimationFrame(this._updateVelocity);
            if (this._isDragging) {
                this._dragLastDeltaX = this._dragDeltaX;
                this._dragLastDeltaY = this._dragDeltaY;
                this._dragDeltaX = this._dragLastX;
                this._dragDeltaY = this._dragLastY;
                this._velocityX = (this._dragDeltaX - this._dragLastDeltaX);
                this._velocityY = (this._dragDeltaY - this._dragLastDeltaY);
            }
            else {
                const deltaX = this._velocityX;
                const deltaY = this._velocityY;
                this._velocityX *= (1 - this._friction);
                this._velocityY *= (1 - this._friction);
                this._dragLastX += deltaX;
                this._dragLastY += deltaY;
                this._accumulatedX += deltaX;
                this._accumulatedY += deltaY;
                this._eventDispatcher.dispatchEvent({
                    type: 'inertiamove',
                    dragStartX: this._dragStartX,
                    dragStartY: this._dragStartY,
                    deltaY,
                    deltaX,
                    accumulatedX: this._accumulatedX,
                    accumulatedY: this._accumulatedY,
                });
            }
        }).bind(this);
        this._onDragStart = this._handleDragStart.bind(this);
        this._onDragMove = this._handleDragMove.bind(this);
        this._onDragEnd = this._handleDragEnd.bind(this);
        this._$el.addEventListener('mousedown', this._onDragStart);
        this._$el.addEventListener('touchstart', this._onDragStart);
    }
    set friction(friction) {
        this._friction = friction;
    }
    get isDragging() {
        return this._isDragging;
    }
    get isInertiaMoving() {
        if (this._isDragging)
            return false;
        if (approxZero(this._velocityX) && approxZero(this._velocityY))
            return false;
        return true;
    }
    addEventListener(type, listener) {
        this._eventDispatcher.addEventListener(type, listener);
    }
    removeEventListener(type, listener) {
        this._eventDispatcher.removeEventListener(type, listener);
    }
    stop() {
        this._velocityX = 0;
        this._velocityY = 0;
        cancelAnimationFrame(this._requestAnimationFrameId);
    }
    forceDragEnd() {
        document.removeEventListener('mousemove', this._onDragMove);
        document.removeEventListener('touchmove', this._onDragMove, passiveFalse);
        document.removeEventListener('mouseup', this._onDragEnd);
        document.removeEventListener('touchend', this._onDragEnd);
        this._isDragging = false;
        this._eventDispatcher.dispatchEvent({
            type: 'dragcancel',
            dragStartX: this._dragStartX,
            dragStartY: this._dragStartY,
            accumulatedX: this._accumulatedX,
            accumulatedY: this._accumulatedY,
        });
    }
    destroy() {
        this.stop();
        this.forceDragEnd();
        this._$el.removeEventListener('mousedown', this._onDragStart);
        this._$el.removeEventListener('touchstart', this._onDragStart);
    }
    _handleDragStart(event) {
        if (event.target instanceof Element &&
            event.target.getAttribute('data-ignore-dragging') !== null) {
            return;
        }
        document.removeEventListener('mousemove', this._onDragMove);
        document.removeEventListener('touchmove', this._onDragMove, passiveFalse);
        document.removeEventListener('mouseup', this._onDragEnd);
        document.removeEventListener('touchend', this._onDragEnd);
        const _event = isTouchEvent(event)
            ? event.touches[0]
            : event;
        this._isDragging = true;
        this._accumulatedX = 0;
        this._accumulatedY = 0;
        this._dragStartX = _event.clientX;
        this._dragStartY = _event.clientY;
        this._dragLastX = _event.clientX;
        this._dragLastY = _event.clientY;
        this._eventDispatcher.dispatchEvent({
            type: 'dragstart',
            dragStartX: this._dragStartX,
            dragStartY: this._dragStartY,
            deltaY: 0,
            deltaX: 0,
            accumulatedX: this._accumulatedX,
            accumulatedY: this._accumulatedY,
        });
        this.stop();
        this._updateVelocity();
        document.addEventListener('mousemove', this._onDragMove);
        document.addEventListener('touchmove', this._onDragMove, passiveFalse);
        document.addEventListener('mouseup', this._onDragEnd);
        document.addEventListener('touchend', this._onDragEnd);
    }
    _handleDragMove(event) {
        event.preventDefault();
        const _event = isTouchEvent(event)
            ? event.touches[0]
            : event;
        const deltaX = _event.clientX - this._dragLastX;
        const deltaY = _event.clientY - this._dragLastY;
        this._accumulatedX += deltaX;
        this._accumulatedY += deltaY;
        this._dragLastX = _event.clientX;
        this._dragLastY = _event.clientY;
        this._eventDispatcher.dispatchEvent({
            type: 'dragmove',
            dragStartX: this._dragStartX,
            dragStartY: this._dragStartY,
            deltaY,
            deltaX,
            accumulatedX: this._accumulatedX,
            accumulatedY: this._accumulatedY,
        });
    }
    _handleDragEnd() {
        this.forceDragEnd();
        this._eventDispatcher.dispatchEvent({
            type: 'dragend',
            dragStartX: this._dragStartX,
            dragStartY: this._dragStartY,
            deltaY: 0,
            deltaX: 0,
            accumulatedX: this._accumulatedX,
            accumulatedY: this._accumulatedY,
        });
    }
}
function approxZero(number) {
    return Math.abs(number) < 0.001;
}

export { InertiaDrag as default };
