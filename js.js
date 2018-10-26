// 以下のサイトのコードを利用させていただきました
// https://mementoo.info/
// http://jsfiddle.net/z3JtC/4
// https://stackoverflow.com/questions/13938686/can-i-load-a-local-file-into-an-html-canvas-element
// https://codepen.io/tuanitpro/pen/wJZJbp
// https://weworkweplay.com/play/saving-html5-canvas-as-image/
// https://codepen.io/noahblon/post/a-practical-guide-to-flexbox-understanding-space-between-the-unsung-hero
// http://maeharin.hatenablog.com/entry/20130215/javascript_prototype_chain
// https://developer.mozilla.org/ja/docs/Web/Guide/HTML/Canvas_tutorial/Basic_usage
//

const SLIDER_WIDTH = 300;

const IMG_WIDTH = 1024;
const R = 0;
const G = 1;
const B = 2;
const A = 3;
const PMAX = 255;

var imgW = 0;
var imgH = 0;
var NDVICanvas = document.createElement( "canvas" );
var imgWkr = null;
var trueImgHandler = null;
var IRImgHandler = null;
var falseImgHandler = null;
var naturalImgHandler = null;
var NDVIImgHandler = null;


// ChromeでローカルファイルのWorkerを実行できない対策用
var imageWorkerSource = 'function imageWorkerOnMessage(a){var t=a.data.type;switch(t){case"SetSize":imgW=a.data.w,imgH=a.data.h;break;case"SetImg":switch(a.data.name){case"outputTrue":trueImgData=a.data.imgData;break;case"outputIR":IRImgData=a.data.imgData}break;case"DoProcess":processImage();break;case"SetTrueShiftX":trueShiftX=a.data.shiftX;break;case"SetTrueShiftY":trueShiftY=a.data.shiftY}}function processImage(){var a=imgW,t=imgH,e=new ImageData(a,t),r=new ImageData(a,t),o=new ImageData(a,t),g=new ImageData(a,t),s=new ImageData(a,t);normalizeColor(trueImgData.data,e.data,a,t),normalizeColor(IRImgData.data,r.data,a,t),createFalseImage(e.data,r.data,g.data,a,t,trueShiftX,trueShiftY),createNaturalImage(e.data,r.data,s.data,a,t,trueShiftX,trueShiftY),createNDVIImage(trueImgData.data,IRImgData.data,o.data,a,t,trueShiftX,trueShiftY),postResultImgData("outputFalse",g),postResultImgData("outputNatural",s),postResultImgData("outputNDVI",o),postComplete()}function postResultImgData(a,t){var e=Object.create(ImgWorkerMessage);e.type="SetResultImgData",e.imgData=t,e.name=a,postMessage(e)}function postComplete(){var a=Object.create(ImgWorkerMessage);a.type="CompleteProcess",postMessage(a)}function normalizeColor(a,t,e,r){for(var o=[PMAX,PMAX,PMAX],g=[0,0,0],s=0;r>s;s++)for(var u=0;e>u;u++){var m=4*(s*e+u),i=a[m+R],f=a[m+G],I=a[m+B];i>g[R]&&(g[R]=i),f>g[G]&&(g[G]=f),I>g[B]&&(g[B]=I),i<o[R]&&(o[R]=i),f<o[G]&&(o[G]=f),I<o[B]&&(o[B]=I)}for(var s=0;r>s;s++)for(var u=0;e>u;u++){var m=4*(s*e+u);t[m+R]=(a[m+R]-o[R])/(g[R]-o[R])*PMAX,t[m+G]=(a[m+G]-o[G])/(g[G]-o[G])*PMAX,t[m+B]=(a[m+B]-o[B])/(g[B]-o[B])*PMAX,t[m+A]=PMAX}}function getShiftedValue(a,t,e,r,o,g,s){var u=r-g,m=o-s;if(0>u||u>=t||0>m||m>=e)return[0,0,0,0];var i=4*(m*t+u);return[a[i+R],a[i+G],a[i+B],a[i+A]]}function createFalseImage(a,t,e,r,o,g,s){for(var u=0;o>u;u++)for(var m=0;r>m;m++){var i=4*(u*r+m),f=getShiftedValue(a,r,o,m,u,g,s);e[i+R]=t[i+R],e[i+G]=f[R],e[i+B]=f[G],e[i+A]=PMAX}}function createNaturalImage(a,t,e,r,o,g,s){for(var u=0;o>u;u++)for(var m=0;r>m;m++){var i=4*(u*r+m),f=getShiftedValue(a,r,o,m,u,g,s);e[i+R]=f[R],e[i+G]=t[i+R],e[i+B]=f[G],e[i+A]=PMAX}}function createNDVIImage(a,t,e,r,o,g,s){for(var u=0;o>u;u++)for(var m=0;r>m;m++){var i=4*(u*r+m),f=getShiftedValue(a,r,o,m,u,g,s),I=((t[i+R]-f[R])/(t[i+R]+f[R])+1)/2*PMAX;e[i+R]=I,e[i+G]=I,e[i+B]=I,e[i+A]=PMAX}}const R=0,G=1,B=2,A=3,PMAX=255;var IRImgData=null,trueImgData=null,imgW=0,imgH=0,trueShiftX=0,trueShiftY=0,ImgWorkerMessage={type:"NullMsg"};addEventListener("message",imageWorkerOnMessage,!1);';

// 基底
var ImgWorkerMessage = {
    type: "NullMsg"
};

if ( window.Worker ) {
    // Create worker
    try {
        imgWkr = new Worker( "./worker.js" );
        console.log( "file worker" );
    } catch ( e ) {
        var blob = new Blob( [imageWorkerSource] );
        var blobURL = URL.createObjectURL( blob );
        
        try {
            imgWkr = new Worker( blobURL );
            console.log( "blob worker" );
        } catch ( e ) {
            alert( "Workerを起動できませんでした" );
            console.log( "Failed to start worker" );
        }
    }
    
    if ( imgWkr ) {
        imgWkr.addEventListener( "message", messageReceived, false );
    }
} else {
    alert( "Workerをサポートしていないブラウザでは動作しません" );
}

// メッセージハンドラー
function messageReceived( e ) {
    var msgType = e.data.type;

    switch ( msgType ) {
    case "SetResultImgData":
        switch ( e.data.name ) {
        case "outputFalse":
            falseImgHandler.imgData = e.data.imgData;
            falseImgHandler.drawImaegData();
            break;
        case "outputNatural":
            naturalImgHandler.imgData = e.data.imgData;
            naturalImgHandler.drawImaegData();
            break;
        case "outputNDVI":
            NDVIImgHandler.imgData = e.data.imgData;
            NDVIImgHandler.drawImaegData();
            break;
        }
        break;
    case "CompleteProcess":
        processCompleted();
        break;
    }
}

// Image Handler class
function ImageHandler( name )
{
    this.outputName = name;
    this.img = new Image();
    this.imgData = null;
    this.iw = 0;
    this.ih = 0;
    this.shiftX = 0;
    this.shiftY = 0;
    this.canvas = document.createElement( "canvas" );
    this.ctx = this.canvas.getContext( "2d" );
    this.loadCompleteHandler = null;
}

ImageHandler.prototype.handleEvent = function( event ) {
    var obj = this;
    var originImg = new Image();
    var file = event.target.files;
    var reader = new FileReader();
 
    if ( !file[0] ) {
        return;
    }

    reader.onload = function() {
        originImg.onload = function() {
            // Disable UIs
            setAllButtonEnable( false ); 
            showProcessSpinner( true );
            
            // Clear
            obj.shiftX = 0;
            obj.shiftY = 0;
            
            // Calc size
            obj.iw = IMG_WIDTH;
            obj.ih = originImg.height / originImg.width * IMG_WIDTH;
            
            // Init canvas
            obj.canvas.width = obj.iw;
            obj.canvas.height = obj.ih;
            
            // Create input image
            obj.ctx.drawImage( originImg, 0, 0, obj.iw, obj.ih );
            obj.imgData = obj.ctx.getImageData( 0, 0, obj.iw, obj.ih );
            var dataURL = obj.canvas.toDataURL( 'image/jpeg', 0.7 );
            obj.img.src = dataURL;
            
            // Draw image
            document.getElementById( obj.outputName ).src = dataURL;
            document.getElementById( obj.outputName + "A" ).href = dataURL;
            
            // Post input image to worker
            obj.postCurrentImage.call( obj );
            
            // Call Complete handler
            if ( obj.loadCompleteHandler ) {
                obj.loadCompleteHandler();
            }
            
            // Enable UIs
            setAllButtonEnable( true ); 
            showProcessSpinner( false );
        }
        
        originImg.src = reader.result;
    }
    
    reader.readAsDataURL( file[0] );
}

ImageHandler.prototype.setImaegSize = function( w, h ) {
    this.iw = w;
    this.ih = h;
    
    // Reset canvas size
    this.canvas.width = w;
    this.canvas.height = h;
}

ImageHandler.prototype.postCurrentImage = function() {
    var msg = Object.create( ImgWorkerMessage );
    msg.type = "SetImg";
    msg.imgData = this.imgData;
    msg.name = this.outputName;
    imgWkr.postMessage( msg );
}

ImageHandler.prototype.drawImaegDataToOwnCanvas = function( dx, dy ) {
    if ( !this.imgData ) return;
    
    this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height );            
    this.ctx.putImageData( this.imgData, dx, dy, 0, 0, this.iw, this.ih );
}

ImageHandler.prototype.drawImaegData = function() {
    if ( !this.imgData ) return;
    
    this.drawImaegDataToOwnCanvas( this.shiftX, this.shiftY ); 
    var dataURL = this.canvas.toDataURL( 'image/jpeg', 0.7 );
    document.getElementById( this.outputName ).src = dataURL;
    document.getElementById( this.outputName + "A" ).href = dataURL;
}

ImageHandler.prototype.drawChannelImaegData = function( channel ) {
    if ( !this.imgData ) {
        return;
    }
    
    this.ctx.clearRect( 0, 0, this.iw, this.ih );
    
    var channelData = new ImageData( this.iw, this.ih );
    
    for ( var y = 0; y < this.ih; y++ ) {
        for ( var x = 0; x < this.iw; x++ ) {
            var idx = ( y * this.iw + x ) * 4;
            channelData.data[idx + A] = PMAX;            
            channelData.data[idx + channel] = this.imgData.data[idx + channel]; 
        }
    }
    
    this.ctx.putImageData( channelData, this.shiftX, this.shiftY, 0, 0, this.iw, this.ih );
    var dataURL = this.canvas.toDataURL( 'image/jpeg', 0.7 );
    document.getElementById( this.outputName ).src = dataURL;
    document.getElementById( this.outputName + "A" ).href = dataURL;
}

function trueImageLoaded()
{
    postShiftTrue();
    resetSlider();
    setSliderEnable( true );
}

function disableSliderTempCanvas() {
    // Promiseを使ったりいろいろしたがうまくいかなかった
    // 汚い方法だけど、Canvasの非表示を100ms後にすることでちらつきを抑えている
    // 100の根拠 -> 最低でも10fpsくらいは出てるだろう  
    if ( document.getElementById( "outputTrueCanvas" ).style.display == "none" ) {
        return;
    }
    
    setTimeout( () => {
        // Remove temp canvas
        document.getElementById( "outputTrueCanvas" ).style.display = "none";
    }, 100 );
}

function enableSlideTempCanvas() {
    document.getElementById( "outputTrueCanvas" ).style.display = "block";
}

function sliderTrueChanged( e ) {
    var sx = document.getElementById( "trueSliderX" ).value;
    var sy = document.getElementById( "trueSliderY" ).value;
    
    trueImgHandler.shiftX = sx - SLIDER_WIDTH / 2;
    trueImgHandler.shiftY = sy - SLIDER_WIDTH / 2;
    
    // Update image
    trueImgHandler.drawImaegData();
    
    // Post shiting value to worker
    postShiftTrue();
    
    // スライダーの値が変化したら描画
    if ( trueImgHandler.img.src && IRImgHandler.img.src ) {
        processImage();
    }
}

function sliderTrueInputed( e ) {
    var sx = document.getElementById( "trueSliderX" ).value;
    var sy = document.getElementById( "trueSliderY" ).value;
    var img = document.getElementById( "outputTrue" );
    var canvas = document.getElementById( "outputTrueCanvas" );
    var ctx = canvas.getContext( "2d" );
    
    // バッファ用キャンバスが表示されてなければ書かない
    if ( canvas.style.display == "none" ) {
        return;
    }
    
    canvas.width = img.offsetWidth;
    canvas.height = img.offsetHeight;
    
    trueImgHandler.shiftX = sx - SLIDER_WIDTH / 2;
    trueImgHandler.shiftY = sy - SLIDER_WIDTH / 2;
    trueImgHandler.drawImaegDataToOwnCanvas( trueImgHandler.shiftX, trueImgHandler.shiftY );
    ctx.drawImage( trueImgHandler.canvas, 0, 0, trueImgHandler.iw, trueImgHandler.ih, 0, 0, canvas.width, canvas.height );
}

function postShiftTrue()
{
    var msg = Object.create( ImgWorkerMessage );
    msg.type = "SetTrueShiftX";
    msg.shiftX = trueImgHandler.shiftX;
    imgWkr.postMessage( msg );
    msg.type = "SetTrueShiftY";
    msg.shiftY = trueImgHandler.shiftY;
    imgWkr.postMessage( msg );
}

function mouseMoveOnNDVIImg( evt ) {
    // Mouse move event handler of NDVI Image
    if ( !NDVICanvas ) return;
    
    var ix = evt.offsetX / evt.target.offsetWidth * NDVICanvas.width;
    var iy = evt.offsetY / evt.target.offsetHeight * NDVICanvas.height;
    
    if ( ix < 0 || iy < 0 || ix >= NDVICanvas.width || iy >= NDVICanvas.height ) {
        return;
    }
    
    var px = NDVICanvas.getContext('2d').getImageData( ix, iy, 1, 1 ); 
    
    document.getElementById( "NDVIPixelValue" ).innerHTML = "NDVI値 : " + ( px.data[0] / PMAX * 2 - 1 ).toFixed( 3 );
}

window.addEventListener( "DOMContentLoaded", () => {
    // Check IE
    var ua = window.navigator.userAgent.toLowerCase();

    if( ua.indexOf('msie') >= 0 || ua.indexOf('trident') >= 0 ) {
        alert( "申し訳ありません\nInternetExplorerでは実行できません" );
        // Disable buttons
        setAllButtonEnable( false ); 
        return;
    }
    
    // Load a true image
    var selectTrue = document.getElementById( "selectTrue" );
    trueImgHandler = new ImageHandler( "outputTrue" );
    trueImgHandler.loadCompleteHandler = trueImageLoaded;
    selectTrue.addEventListener( "change", trueImgHandler, false );
    
    // Load a NIR Image
    var selectIR = document.getElementById( "selectIR" );
    IRImgHandler = new ImageHandler( "outputIR" );
    selectIR.addEventListener( "change", IRImgHandler, false );
    
    // Create Result images
    falseImgHandler   = new ImageHandler( "outputFalse" );
    naturalImgHandler = new ImageHandler( "outputNatural" );
    NDVIImgHandler = new ImageHandler( "outputNDVI" );
    
    // Register event handlers
    // Button events
    document.getElementById( "selectTrueButton" ).addEventListener( "click", () => { document.getElementById( 'selectTrue' ).click(); }, false );
    document.getElementById( "selectIRButton" ).addEventListener( "click",   () => { document.getElementById( 'selectIR' ).click(); }, false );
    document.getElementById( "processButton" ).addEventListener( "click",    () => { processImage(); }, false );
    
    // Mouse event
    document.getElementById( "outputNDVI" ).addEventListener( "mousemove", mouseMoveOnNDVIImg, false );
    
    // Slider event
    // changeは値が変化しないと呼ばれないので、ひとまずmouseupとtouchendて対処
    document.getElementById( "trueSliderX" ).addEventListener( "change", sliderTrueChanged, false );
    document.getElementById( "trueSliderY" ).addEventListener( "change", sliderTrueChanged, false );
    document.getElementById( "trueSliderX" ).addEventListener( "input",  sliderTrueInputed, false );
    document.getElementById( "trueSliderY" ).addEventListener( "input",  sliderTrueInputed, false );
    document.getElementById( "trueSliderX" ).addEventListener( "mousedown",  () => { enableSlideTempCanvas(); }, false );
    document.getElementById( "trueSliderY" ).addEventListener( "mousedown",  () => { enableSlideTempCanvas(); }, false );
    document.getElementById( "trueSliderX" ).addEventListener( "touchstart", () => { enableSlideTempCanvas(); }, false );
    document.getElementById( "trueSliderY" ).addEventListener( "touchstart", () => { enableSlideTempCanvas(); }, false );
    document.getElementById( "trueSliderX" ).addEventListener( "mouseup",  () => { disableSliderTempCanvas(); }, false );
    document.getElementById( "trueSliderY" ).addEventListener( "mouseup",  () => { disableSliderTempCanvas(); }, false );
    document.getElementById( "trueSliderX" ).addEventListener( "touchend", () => { disableSliderTempCanvas(); }, false );
    document.getElementById( "trueSliderY" ).addEventListener( "touchend", () => { disableSliderTempCanvas(); }, false );
    
    // Channel selector event
    document.querySelectorAll( ".channelSelector" ).forEach( function( item ) { item.addEventListener( "click", ( e ) => { onChannelSelect( e ); e.preventDefault(); }, false ); } );
    
    // iOS enable active state
    document.querySelectorAll( ".easybtn" ).forEach( function( item ) { item.addEventListener( "touchstart", () => {}, false ); } );
    
    // Reset UI
    setSliderEnable( false );
});

function processImage() {
    // Check images have been loaded
    if ( !trueImgHandler.img.src || !IRImgHandler.img.src ) {
        alert( "可視光画像と近赤外画像を選択してください" );
        return;
    }
    
    imgW = trueImgHandler.iw;
    imgH = trueImgHandler.ih;
    var w = imgW;
    var h = imgH;
    
    // Check size
    if ( w != IRImgHandler.iw || h != IRImgHandler.ih ) {
        alert( "同じ大きさの画像を選択してください" );
        return;
    }
    
    // Disable buttons
    setAllButtonEnable( false ); 
    // Disable slider
    setSliderEnable( false );
    // Show progress
    showProcessSpinner( true );
    
    // Set result image size
    falseImgHandler.setImaegSize( w, h );
    naturalImgHandler.setImaegSize( w, h );
    NDVIImgHandler.setImaegSize( w, h );
    
    // Clear result
    clearAllResultImage();
    
    // Post Image size
    postImageSize( w, h );
    
    // Post start process
    postStartProcess();
}

function postStartProcess() {   // Private
    var msg = Object.create( ImgWorkerMessage );
    msg.type = "DoProcess";
    imgWkr.postMessage( msg );
}

function processCompleted() {
    // Create result canvas
    NDVICanvas.width = imgW;
    NDVICanvas.height = imgH;
    NDVICanvas.getContext('2d').putImageData( NDVIImgHandler.imgData, 0, 0 ); 
    
    // Enable buttons
    setAllButtonEnable( true ); 
    // Enable slider
    setSliderEnable( true );
    // Hide spinner
    showProcessSpinner( false ); 
}

function postImageSize( w, h ) {
    var msg = Object.create( ImgWorkerMessage );
    msg.type = "SetSize";
    msg.w = w;
    msg.h = h;
    imgWkr.postMessage( msg );
}

function setAllButtonEnable( status ) {
    setButtonEnable( "selectTrueButton", status );
    setButtonEnable( "selectIRButton", status );
    setButtonEnable( "processButton", status );
}

function clearAllResultImage()
{
    document.getElementById( "outputFalse" ).src = "";
    document.getElementById( "outputNatural" ).src = "";
    document.getElementById( "outputNDVI" ).src = "";
}

function setButtonEnable( buttonName, status ) {
    document.getElementById( buttonName ).disabled = !status;
}

function showProcessSpinner( status ) {
    if ( status ) {
        document.querySelectorAll( ".spinnerWrap" ).forEach( ( item ) => {
            item.style = "display: block";
        } );
    } else {
        document.querySelectorAll( ".spinnerWrap" ).forEach( ( item ) => {
            item.style = "display: none";
        } );
    }
}

function resetSlider() {
    var sx = document.getElementById( "trueSliderX" );
    sx.min = 0;
    sx.max = SLIDER_WIDTH;
    sx.value = SLIDER_WIDTH / 2;
    
    var sy = document.getElementById( "trueSliderY" );
    sy.min = 0;
    sy.max = SLIDER_WIDTH;
    sy.value = SLIDER_WIDTH / 2;
}

function setSliderEnable( status ) {
    var sx = document.getElementById( "trueSliderX" );
    var sy = document.getElementById( "trueSliderY" );
    
    sx.disabled = !status;
    sy.disabled = !status;
}

// 色を変える
function onChannelSelect( event ) {
    var a = event.target;
    
    switch ( a.id ) {
    case "trueRSelector":
        trueImgHandler.drawChannelImaegData( R );
        break;
    case "trueGSelector":
        trueImgHandler.drawChannelImaegData( G );
        break;
    case "trueBSelector":
        trueImgHandler.drawChannelImaegData( B );
        break;
    case "trueAllSelector":
        trueImgHandler.drawImaegData();
        break;
    case "IRRSelector":
        IRImgHandler.drawChannelImaegData( R );
        break;
    case "IRGSelector":
        IRImgHandler.drawChannelImaegData( G );
        break;
    case "IRBSelector":
        IRImgHandler.drawChannelImaegData( B );
        break;
    case "IRAllSelector":
        IRImgHandler.drawImaegData();
        break;
    case "falseRSelector":
        falseImgHandler.drawChannelImaegData( R );
        break;
    case "falseGSelector":
        falseImgHandler.drawChannelImaegData( G );
        break;
    case "falseBSelector":
        falseImgHandler.drawChannelImaegData( B );
        break;
    case "falseAllSelector":
        falseImgHandler.drawImaegData();
        break;
    case "naturalRSelector":
        naturalImgHandler.drawChannelImaegData( R );
        break;
    case "naturalGSelector":
        naturalImgHandler.drawChannelImaegData( G );
        break;
    case "naturalBSelector":
        naturalImgHandler.drawChannelImaegData( B );
        break;
    case "naturalAllSelector":
        naturalImgHandler.drawImaegData();
        break;
    }
}
