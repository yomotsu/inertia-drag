/** !
 *
 * Copyright 2013 @yomotsu
 * Licensed under the MIT License:
 * http://www.opensource.org/licenses/mit-license.php
 */

;( function ( $ ) {
    var $doc = $( document );

    InertiaDrag = function ( targetID ) {
        this.$el = $( document.getElementById( targetID ) );
        this.x = 0;
        this.y = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this._canAnimate = false;
        this._savedData = [];
        this._interval = null;

        this.$el.on( 'mousedown', $.proxy( this._onDragStart, this ) );
        $doc.on( 'mouseup', $.proxy( this._onDragEnd, this ) );
    };

    InertiaDrag.prototype.stop = function () {
        this._canAnimate = false;
    };

    InertiaDrag.prototype.update = function ( x, y ) {
        this.x = x;
        this.y = y;
        this.dispatchEvent( { type: 'update' } );
    };

    // https://github.com/mrdoob/eventdispatcher.js
    InertiaDrag.prototype.addEventListener = function ( type, listener ) {
        if ( this._listeners === undefined ) this._listeners = {};
        var listeners = this._listeners;
        if ( listeners[ type ] === undefined ) {
            listeners[ type ] = [];
        }
        if ( listeners[ type ].indexOf( listener ) === - 1 ) {
            listeners[ type ].push( listener );
        }
    };

    InertiaDrag.prototype.dispatchEvent = function ( event ) {
        if ( this._listeners === undefined ) return;
        var listeners = this._listeners;
        var listenerArray = listeners[ event.type ];
        if ( listenerArray !== undefined ) {
            event.target = this;
            for ( var i = 0, l = listenerArray.length; i < l; i ++ ) {
                listenerArray[ i ].call( this, event );
            }
        }
    };

    InertiaDrag.prototype._onDragStart = function ( e ) {
        var that = this;
        this.stop();
        this._savedData = [];
        var offset = this.$el.offset();
        this.dragStartX = e.pageX - offset.left;
        this.dragStartY = e.pageY - offset.top;
        this.dispatchEvent( { type: 'dragStart' } );
        
        this._clear();
        this._watchPointerPosiiton( e );
        this._savePointerPosition();

        $doc.on( 'mousemove', $.proxy( this._watchPointerPosiiton, this ) );
        this._interval = setInterval( $.proxy( this._savePointerPosition, this ), 50 );
    };

    InertiaDrag.prototype._onDragEnd = function ( e ) {
        if( this._canAnimate || this._savedData.length === 0 ) {
            return false;
        }

        this._clear();
        this._watchPointerPosiiton( e );
        this._savePointerPosition();

        var index;
        var delta;
        var lastData = this._savedData[ this._savedData.length - 1 ];
        var startData;
        
        for ( var i = this._savedData.length; i > 0; i-- ) {
            index = i - 1;
            if ( !!this._savedData[ index ] ) {
                delta = Date.now() - this._savedData[ index ].time;
                if ( delta > 10 || index === 0 ) {
                    startData = this._savedData[ Math.max( index - 1, 0 ) ];
                    break;
                }
            }
        }

        var acceleration = {
            delta: delta,
            x: ( lastData.x - startData.x ) / delta,
            y: ( lastData.y - startData.y ) / delta
        };

        var that = this;
        this._savedData = [];
        ( function animate ( acceleration ) {
            that._canAnimate = true;
            var duration = Math.max( Math.abs( acceleration.x /  acceleration.delta ), Math.abs( acceleration.y / acceleration.delta ) ) * 10000;
            var startX = that.x;
            var startY = that.y;
            var startTime = Date.now();
            
            ( function loop () {
                if ( !that._canAnimate ) {
                    return;
                }
                var x, y, percent;
                var elapsedTime = Date.now() - startTime;
                if ( elapsedTime < duration ) {
                    setTimeout( loop, 60 / 1000 );
                    percent = easeOutQuart( elapsedTime, 0.0, 1.0, duration );
                    x = startX + acceleration.x * percent * 100;
                    y = startY + acceleration.y * percent * 100;
                } else {
                    x = startX + acceleration.x * 100;
                    y = startY + acceleration.y * 100;
                    that.stop();
                }
                that.update( x, y );
            } )();
        } )( acceleration );
    };

    InertiaDrag.prototype._watchPointerPosiiton = function ( e ) {
        this.update(
            e.pageX - this.dragStartX,
            e.pageY - this.dragStartY
        );
    };

    InertiaDrag.prototype._savePointerPosition = function () {
        if ( this._savedData.length > 9 ) {
            this._savedData.shift();
        };
        this._savedData.push( {
            time: Date.now(),
            x: this.x,
            y: this.y
        } );
    };

    InertiaDrag.prototype._clear = function () {
        clearInterval( this._interval );
        $doc.off( 'mousemove', $.proxy( this._watchPointerPosiiton, this ) );
        this.stop();
    };

    function easeOutQuart ( t, b, c, d ) {
        return -c * ( ( t = t / d - 1 ) * t * t * t - 1 ) + b;
    };

} )( jQuery );