// ImageWorker

const R = 0;
const G = 1;
const B = 2;
const A = 3;
const PMAX = 255;

var IRImgData = null;
var trueImgData = null;
var imgW = 0;
var imgH = 0;
var trueShiftX = 0;
var trueShiftY = 0;

// 基底
var ImgWorkerMessage = {
    type: "NullMsg"
};

// ハンドラー登録
addEventListener( "message", imageWorkerOnMessage, false );

// Message handler
function imageWorkerOnMessage( e ) {
    var msgType = e.data.type;
    
    console.log( msgType );
    
    switch ( msgType ) {
    case "SetSize":
        imgW = e.data.w;
        imgH = e.data.h;
        break;
    case "SetImg":
        switch ( e.data.name ) {
        case "outputTrue":
            trueImgData = e.data.imgData;
            break;
        case "outputIR":
            IRImgData  = e.data.imgData;
            break;
        }
        break;
    case "DoProcess":
        processImage();
        break;
    case "SetTrueShiftX":
        trueShiftX = e.data.shiftX;
        break;
    case "SetTrueShiftY":
        trueShiftY = e.data.shiftY;
        break;
    }
}

function processImage() {
    var w = imgW;
    var h = imgH;
    
    // Create ImageData
    var normTrueImgData = new ImageData( w, h );
    var normIRImgData = new ImageData( w, h );
    var NDVIImgData = new ImageData( w, h );
    var falseImgData = new ImageData( w, h );
    var naturalImgData = new ImageData( w, h );
    
    // Normalize
    normalizeColor( trueImgData.data, normTrueImgData.data, w, h );
    normalizeColor( IRImgData.data, normIRImgData.data, w, h );
    
    // Process
    createFalseImage( normTrueImgData.data, normIRImgData.data, falseImgData.data, w, h, trueShiftX, trueShiftY );
    createNaturalImage( normTrueImgData.data, normIRImgData.data, naturalImgData.data, w, h, trueShiftX, trueShiftY );
    createNDVIImage( trueImgData.data, IRImgData.data, NDVIImgData.data, w, h, trueShiftX, trueShiftY );
    
    // Post result
    postResultImgData( "outputFalse",   falseImgData );
    postResultImgData( "outputNatural", naturalImgData );
    postResultImgData( "outputNDVI",    NDVIImgData );
    
    // Post complete
    postComplete();
}

function postResultImgData( name, imgData ) {
    var msg = Object.create( ImgWorkerMessage );
    msg.type = "SetResultImgData";
    msg.imgData = imgData;
    msg.name = name;
    postMessage( msg );
}

function postComplete() {
    var msg = Object.create( ImgWorkerMessage );
    msg.type = "CompleteProcess";
    postMessage( msg );
}

function normalizeColor( src, dest, w, h ) {
    var mins = [PMAX,PMAX,PMAX];
    var maxs = [0,0,0];
    
    // Search mins and maxs
    for ( var y = 0; y < h; y++ ) {
        for ( var x = 0; x < w; x++ ) {
            var idx = ( y * w + x ) * 4;
            var r = src[idx + R];
            var g = src[idx + G];
            var b = src[idx + B];
            
            if ( r > maxs[R] ) maxs[R] = r; 
            if ( g > maxs[G] ) maxs[G] = g; 
            if ( b > maxs[B] ) maxs[B] = b;
            
            if ( r < mins[R] ) mins[R] = r; 
            if ( g < mins[G] ) mins[G] = g;  
            if ( b < mins[B] ) mins[B] = b;  
        }
    }
    
    // Normalize
    for ( var y = 0; y < h; y++ ) {
        for ( var x = 0; x < w; x++ ) {
            var idx = ( y * w + x ) * 4;

            dest[idx + R] = ( src[idx + R] - mins[R] ) / ( maxs[R] - mins[R] ) * PMAX;
            dest[idx + G] = ( src[idx + G] - mins[G] ) / ( maxs[G] - mins[G] ) * PMAX;
            dest[idx + B] = ( src[idx + B] - mins[B] ) / ( maxs[B] - mins[B] ) * PMAX;
            
            dest[idx + A] = PMAX;
        }
    }
}

function getShiftedValue( src, w, h, x, y, srcShiftX, srcShiftY ) {
    var cx = x - srcShiftX;
    var cy = y - srcShiftY;
    
    if ( cx < 0 || cx >= w || cy < 0 || cy >= h ) {
        return [0, 0, 0, 0];
    } else {
        var idx = ( cy * w + cx ) * 4;
        return src.slice( idx, idx + 3 );
    }
}

function createFalseImage( trueSrc, IRSrc, dest, w, h, trueSrcShiftX, trueSrcShiftY ) {    
    // Create false image
    for ( var y = 0; y < h; y++ ) {
        for ( var x = 0; x < w; x++ ) {
            var idx = ( y * w + x ) * 4;
            var trueVal = getShiftedValue( trueSrc, w, h, x, y, trueShiftX, trueShiftY );
            
            dest[idx + R] = IRSrc[idx + R];
            dest[idx + G] = trueVal[R];
            dest[idx + B] = trueVal[G];
            dest[idx + A] = PMAX;
        }
    }
}

function createNaturalImage( trueSrc, IRSrc, dest, w, h, trueSrcShiftX, trueSrcShiftY ) {    
    // Create Natural image
    for ( var y = 0; y < h; y++ ) {
        for ( var x = 0; x < w; x++ ) {
            var idx = ( y * w + x ) * 4;
            var trueVal = getShiftedValue( trueSrc, w, h, x, y, trueShiftX, trueShiftY );
            
            dest[idx + R] = trueVal[R];
            dest[idx + G] = IRSrc[idx + R];
            dest[idx + B] = trueVal[G];
            dest[idx + A] = PMAX;
        }
    }
}

function createNDVIImage( trueSrc, IRSrc, dest, w, h, trueSrcShiftX, trueSrcShiftY ) {    
    // Create NDVI image
    for ( var y = 0; y < h; y++ ) {
        for ( var x = 0; x < w; x++ ) {
            var idx = ( y * w + x ) * 4;
            var trueVal = getShiftedValue( trueSrc, w, h, x, y, trueShiftX, trueShiftY );
            
            var val = ( ( IRSrc[idx + R] - trueVal[R] ) / ( IRSrc[idx + R] + trueVal[R] ) + 1 ) / 2 * PMAX;
            
            dest[idx + R] = val;
            dest[idx + G] = val;
            dest[idx + B] = val;
            dest[idx + A] = PMAX;
        }
    }
}
