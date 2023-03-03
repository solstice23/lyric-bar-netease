import { getSetting, setSetting, copyTextToClipboard } from './utils.js';
import './lyrics.scss';

import _isEqual from 'lodash/isEqual';

const useState = React.useState;
const useEffect = React.useEffect;
const useLayoutEffect = React.useLayoutEffect;
const useMemo = React.useMemo;
const useCallback = React.useCallback;
const useRef = React.useRef;

const isFMSession = () => {
	return !document.querySelector(".m-player-fm").classList.contains("f-dn");
}
// TODO: 监听 DOM 更改以缓存此函数

const customBlurFunc = localStorage.getItem('rnp-custom-blur-func', null) ? new Function('offset', localStorage.getItem('rnp-custom-blur-func')) : null;
const customScaleFunc = localStorage.getItem('rnp-custom-scale-func', null) ? new Function('offset', localStorage.getItem('rnp-custom-scale-func')) : null;

export function Lyrics(props) {
	const isFM = props.isFM ?? false;

	const containerRef = useRef(null);

	let [lyrics, setLyrics] = useState(null);
	const _lyrics = useRef(null);
	const _setLyrics = setLyrics;
	setLyrics = (x) => {
		_lyrics.current = x;
		_setLyrics(x);
	}
	const [hasTranslation, setHasTranslation] = useState(false);
	const [hasRomaji, setHasRomaji] = useState(false);
	const [hasKaraoke, setHasKaraoke] = useState(false);

	const [playState, setPlayState] = useState(null);
	const _playState = useRef(null);
	const [songId, setSongId] = useState("0");
	const currentTime = useRef(0); // 当前播放时间
	const [seekCounter, setSeekCounter] = useState(0); // 拖动进度条时修改触发重渲染
	const [recalcCounter, setRecalcCounter] = useState(0); // 手动重计算时触发渲染

	let [currentLine, setCurrentLine] = useState(0);
	const _currentLine = useRef(0);
	const _setCurrentLine = setCurrentLine;
	setCurrentLine = (x) => {
		_currentLine.current = x;
		_setCurrentLine(x);
	}
	const [currentLineForScrolling, setCurrentLineForScrolling] = useState(0);	// 为提前 0.2s 滚动，使滚动 delay 与逐词歌词对应 而设置的 提前的，仅用于滚动的 currentLine

	const [globalOffset, setGlobalOffset] = useState(parseInt(getSetting('lyric-offset', 0)));

	const heightOfItems = useRef([]);

	const [containerHeight, setContainerHeight] = useState(0);
	const [containerWidth, setContainerWidth] = useState(0);

	const [fontSize, setFontSize] = useState(getSetting('lyric-font-size', 32));
	const [lyricZoom, setLyricZoom] = useState(getSetting('lyric-zoom', false));
	const [lyricBlur, setLyricBlur] = useState(getSetting('lyric-blur', false));
	const [showTranslation, setShowTranslation] = useState(getSetting('show-translation', true));
	const [showRomaji, setShowRomaji] = useState(getSetting('show-romaji', true));
	const [useKaraokeLyrics, setUseKaraokeLyrics] = useState(getSetting('use-karaoke-lyrics', true));
	const [karaokeAnimation, setKaraokeAnimation] = useState(getSetting('karaoke-animation', 'float'));


	const [lineTransforms, setLineTransforms] = useState([]);
	const shouldTransit = useRef(true);

	const isPureMusic = lyrics && (
		lyrics.length === 1 ||
		lyrics.length <= 10 && lyrics.some((x) => (x.originalLyric ?? '').includes('纯音乐'))
	);

	const isCurrentModeSession = () => { // 判断是否在当前模式播放 (普通/FM)
		return isFM ? isFMSession() : !isFMSession();
	}


	const onLyricsUpdate = (e) => {
		if (!e.detail) {
			return;
		}
		if (!isCurrentModeSession()) {
			return;
		}
		shouldTransit.current = false;
		setCurrentLine(0);
		setCurrentLineForScrolling(0);
		setLyrics(e.detail.lyrics);
		setHasTranslation(e.detail.lyrics.some((x) => x.translatedLyric));
		setHasRomaji(e.detail.lyrics.some((x) => x.romanLyric));
		setHasKaraoke(e.detail.lyrics.some((x) => x.dynamicLyric));
	}

	useEffect(() => {
		shouldTransit.current = false;
		if (window.currentLyrics) {
			const currentLyrics = window.currentLyrics.lyrics;
			setLyrics(currentLyrics);
			setHasTranslation(currentLyrics.some((x) => x.translatedLyric));
			setHasRomaji(currentLyrics.some((x) => x.romanLyric));
			setHasKaraoke(currentLyrics.some((x) => x.dynamicLyric));
		}
		document.addEventListener('lyrics-updated', onLyricsUpdate);
		return () => {
			document.removeEventListener('lyrics-updated', onLyricsUpdate);
		}
	}, []);


	useEffect(() => { // Recalculate height of each line
		if (!lyrics) return;
		const container = containerRef.current;
		const items = container.children;
		const heights = [];
		for (const item of items) {
			heights.push(item.clientHeight);
		}
		heightOfItems.current = heights;
		//console.log('heightOfItems', heightOfItems.current);
	}, [lyrics, containerWidth, fontSize, showTranslation, showRomaji, useKaraokeLyrics, karaokeAnimation, recalcCounter]);

	/*const recalcHeightOfItems = () => {
		if (!lyrics) return;
		const container = containerRef.current;
		const items = container.children;
		const heights = [];
		for (const item of items) {
			heights.push(item.clientHeight);
		}
		heightOfItems.current = heights;
		//console.log('heightOfItems', heightOfItems.current);
	}*/
	
	const onResize = () => {
		shouldTransit.current = false;
		const container = containerRef.current;
		setContainerHeight(container.clientHeight);
		setContainerWidth(container.clientWidth - 30);
		console.log('resize', container.clientWidth, container.clientHeight);
	};

	useEffect(() => {
		const resizeObserver = new ResizeObserver(() => {
			onResize();
		});
		resizeObserver.observe(containerRef.current);
		onResize();
		//window.addEventListener("resize", onResize);
		return () => {
			//window.removeEventListener("resize", onResize);
			resizeObserver.disconnect();
		}
	}, []);

	useEffect(() => {
		const onRecalc = () => {
			setRecalcCounter(+ new Date());
		}
		window.addEventListener('recalc-lyrics', onRecalc);
		return () => {
			window.removeEventListener('recalc-lyrics', onRecalc);
		}
	});

	const previousFocusedLineRef = useRef(0);
	useEffect(() => { // Recalculate vertical positions and transforms of each line
		if (!lyrics?.length) return;

		//const space = fontSize * 1.2;
		const space = 5;


		//console.log(currentLine, previousFocusedLineRef.current, currentLine - previousFocusedLineRef.current > 0 ? 1 : -1);

		const transforms = [];
		for (let i = 0; i <= lyrics.length; i++) transforms.push({ top: 0, scale: 1, delay: 0 });
		//console.log('containerHeight', containerHeight);
		let current = Math.min(Math.max(currentLineForScrolling ?? 0, 0), lyrics.length - 1);

	//	if (!scrollingMode) recalcHeightOfItems();
		//console.log(currentLine, current);
		//transforms[current].top = containerHeight / 2 - heightOfItems.current[current] / 2;
		transforms[current].top = 
			containerRef.current.clientHeight * 0.5 - 
			heightOfItems.current[current] / 2;
		const currentLineHeight = heightOfItems.current[current];
		if (lyrics[current].isInterlude) {
			// temporary heighten the interlude line
			heightOfItems.current[current] = currentLineHeight + 50;
		}
		// all lines before current
		for (let i = current - 1; i >= 0; i--) {
			let scaledHeight = heightOfItems.current[i];
			transforms[i].top = transforms[i + 1].top - scaledHeight - space;
		}
		// all lines after current
		for (let i = current + 1; i < lyrics.length; i++) {
			const previousScaledHeight = heightOfItems.current[i - 1];
			transforms[i].top = transforms[i - 1].top + previousScaledHeight + space;
		}
		// set the height of interlude line back to normal
		heightOfItems.current[current] = currentLineHeight;
		// reset delay to 0 if necessary
		// for no transition when resizing, etc.
		if (!shouldTransit.current) {
			for (let i = 0; i < lyrics.length; i++) {
				transforms[i].delay = 0;
				transforms[i].duration = 0;
			}
		}
		// reduce duration when scrolling
		/*if (scrollingMode) {
			for (let i = 0; i <= lyrics.length; i++) {
				transforms[i].duration = 200;
			}
		}*/
	
		setLineTransforms(transforms);
		//console.log('transforms', transforms);
		previousFocusedLineRef.current = currentLineForScrolling;
	},[
		currentLineForScrolling,
		containerHeight, containerWidth,
		fontSize, lyricZoom, lyricBlur,
		showTranslation, showRomaji, useKaraokeLyrics,
		recalcCounter,
		lyrics
	]);


	const onPlayStateChange = (id, state) => {
		if (!isCurrentModeSession()) {
			return;
		}
		if (!isFM) {
			_playState.current = document.querySelector("#main-player .btnp").classList.contains("btnp-pause");
		} else {
			_playState.current = document.querySelector(".m-player-fm .btnp").classList.contains("btnp-pause");
		}
		setPlayState(_playState.current);
		//setPlayState((state.split("|")[1] == "resume"));
		if (document.querySelector(".m-player-fm .btnp").classList.contains("btnp-pause")) {
			setCurrentLineForScrolling(currentLine);
		}
		setSongId(id);
	};
	const onPlayProgress = (id, progress) => {
		if (!isCurrentModeSession()) {
			return;
		}
		//console.log("new progress", id, progress);
		//setSongId(id);
		const lastTime = currentTime.current + globalOffset;
		currentTime.current = ((progress * 1000) || 0);
		const currentTimeWithOffset = currentTime.current + globalOffset;
		if (!_lyrics.current) return;
		let startIndex = 0;
		if (currentTimeWithOffset - lastTime > 0 && currentTimeWithOffset - lastTime < 50) {
			startIndex = Math.max(0, currentLine - 1);
		}
		if (currentTimeWithOffset < lastTime - 10) {
			setSeekCounter(+new Date());
		}
	
		let cur = 0;
		for (let i = startIndex; i < _lyrics.current.length; i++) {
			if (_lyrics.current[i].time <= currentTimeWithOffset) {
				cur = i;
			} else {
				break;
			}
		}
		if (
			cur == _lyrics.current.length - 1 &&
			_lyrics.current[cur].duration &&
			currentTimeWithOffset > _lyrics.current[cur].time + _lyrics.current[cur].duration + 500
		) {
			cur = _lyrics.current.length;
		}
	
		let curForScrolling = Math.max(0, cur - 1);
		const scrollingDelay = 0;
		for (let i = startIndex; i < _lyrics.current.length; i++) {
			if (_lyrics.current[i].time <= currentTimeWithOffset + scrollingDelay) {
				curForScrolling = i;
			} else {
				break;
			}
		}
		
		shouldTransit.current = true;
		setCurrentLine(cur);
		setCurrentLineForScrolling(curForScrolling);
	};
	useEffect(() => {
		onPlayProgress(songId, currentTime.current / 1000);
	}, [lyrics, globalOffset]);


	useEffect(() => {
		legacyNativeCmder.appendRegisterCall("PlayState", "audioplayer", onPlayStateChange);
		legacyNativeCmder.appendRegisterCall("PlayProgress", "audioplayer", onPlayProgress);
		const _channalCall = channel.call;
		channel.call = (name, ...args) => {
			if (name == "audioplayer.seek") {
				if (isCurrentModeSession()) {
					currentTime.current = parseInt(args[1][2] * 1000);
					setSeekCounter(+new Date());
				}
			}
			_channalCall(name, ...args);
		};
		return () => {
			legacyNativeCmder.removeRegisterCall("PlayState", "audioplayer", onPlayStateChange);
			legacyNativeCmder.removeRegisterCall("PlayProgress", "audioplayer", onPlayProgress);
			channel.call = _channalCall;
		}
	});

	const jumpToTime = useCallback((time) => {
		time -= globalOffset;
		shouldTransit.current = true;
		//console.log(songId);
		channel.call("audioplayer.seek", () => {}, [
			songId,
			`${songId}|seek|${Math.random().toString(36).substring(6)}`,
			time / 1000,
		]);
		/*console.log("audioplayer.seek", () => {}, [
			songId,
			`${songId}|seek|${Math.random().toString(36).substring(6)}`,
			time / 1000,
		]);*/
		setSeekCounter(+new Date());
		if (!playState) {
			if (!isFM) document.querySelector("#main-player .btnp").click();
			else document.querySelector(".m-player-fm .btnp").click();
		}
	}, [songId, playState, globalOffset]);


	useEffect(() => {
		const onLyricFontSizeChange = (e) => {
			setFontSize(e.detail ?? 32);
		}
		const onLyricZoomChange = (e) => {
			setLyricZoom(e.detail ?? false);
		}
		const onLyricBlurChange = (e) => {
			setLyricBlur(e.detail ?? false);
		}
		const onKaraokeAnimationChange = (e) => {
			setKaraokeAnimation(e.detail ?? 'float');
			setTimeout(() => {
				window.dispatchEvent(new CustomEvent("recalc-lyrics"));
			}, 0);
		}
		document.addEventListener("rnp-lyric-font-size", onLyricFontSizeChange);
		document.addEventListener("rnp-lyric-zoom", onLyricZoomChange);
		document.addEventListener("rnp-lyric-blur", onLyricBlurChange);
		document.addEventListener("rnp-karaoke-animation", onKaraokeAnimationChange);
		return () => {
			document.removeEventListener("rnp-lyric-font-size", onLyricFontSizeChange);
			document.removeEventListener("rnp-lyric-zoom", onLyricZoomChange);
			document.removeEventListener("rnp-lyric-blur", onLyricBlurChange);
			document.removeEventListener("rnp-karaoke-animation", onKaraokeAnimationChange);
		}
	}, []);

	useEffect(() => {
		const onGlobalOffsetChange = (e) => {
			setGlobalOffset(parseInt(e.detail) ?? 0);
			setSeekCounter(+new Date());
		}
		document.addEventListener("rnp-global-offset", onGlobalOffsetChange);
		return () => {
			document.removeEventListener("rnp-global-offset", onGlobalOffsetChange);
		}
	}, []);

	const length = lyrics?.length ?? 0;

	return (
		<>
			<div
				className={`rnp-lyrics ${isPureMusic ? 'pure-music' : ''}`}
				ref={containerRef}
				style={{
					fontSize: `${fontSize}px`,
				}}>
				{lyrics && lyrics.map((line, index) => {
					return <Line
						key={`${songId} ${index}`}
						id={index}
						line={line}
						currentLine={currentLine}
						currentTime={currentTime.current + globalOffset}
						seekCounter={seekCounter}
						playState={playState}
						showTranslation={showTranslation}
						showRomaji={showRomaji}
						useKaraokeLyrics={useKaraokeLyrics}
						jumpToTime={isPureMusic ? () => {} : jumpToTime}
						transforms={lineTransforms[index] ?? { top: 0, scale: 1, delay: 0, blur: 0 }}
						karaokeAnimation={karaokeAnimation}
						outOfRangeKaraoke={/*length > 100 && */Math.abs(index - currentLine) > 10}
						containerWidth={containerWidth}
					/>
				})}
			</div>
			<div className="rnp-lyrics-switch">
				<button
					className={`
						rnp-lyrics-switch-btn
						${showTranslation ? 'active' : ''}
						${hasTranslation ? '' : 'unavailable'}
					`}
					title="翻译"
					onClick={() => {
						setSetting("show-translation", !showTranslation);
						setShowTranslation(!showTranslation);
					}}>译</button>
				<button 
					className={`
						rnp-lyrics-switch-btn
						${showRomaji ? 'active' : ''}
						${hasRomaji ? '' : 'unavailable'}
					`}
					title="罗马音"
					onClick={() => {
						setSetting("show-romaji", !showRomaji);
						setShowRomaji(!showRomaji);
					}}>音</button>
				<button 
					className={
						`rnp-lyrics-switch-btn
						${useKaraokeLyrics ? 'active' : ''}
						${hasKaraoke ? '' : 'unavailable'}
					`}
					title="逐字歌词"
					onClick={() => {
						setSetting("use-karaoke-lyrics", !useKaraokeLyrics);
						setUseKaraokeLyrics(!useKaraokeLyrics);
					}}>逐字</button>
			</div>
		</>
	);
}
function Line(props) {
	if (props.line.originalLyric == '') {
		props.line.isInterlude = true;
	}
	const offset = props.id - props.currentLine;


	return (
		<div
			className={`rnp-lyrics-line ${props.line.isInterlude ? 'rnp-interlude' : ''}`}
			offset={offset}
			style={{
				transform: `
					translateY(${props.transforms.top}px)
				`,
				transitionDelay: `${props.transforms.delay}ms`,
				transitionDuration: `${props.transforms?.duration ?? 500}ms`
			}}>
			{ props.line.dynamicLyric && props.useKaraokeLyrics && 
				<SingleLineScroller {...props} active='karaoke'/>
			}
			{ !(props.line.dynamicLyric && props.useKaraokeLyrics) && props.line.originalLyric &&
				<SingleLineScroller {...props} active='original'/>
			}
			{ props.line.romanLyric && props.showRomaji && 
				<SingleLineScroller {...props} active='romaji'/>
			}
			{ props.line.translatedLyric && props.showTranslation && 
				<SingleLineScroller {...props} active='translated'/>
			}
			{ props.line.isInterlude && <Interlude
				id={props.id}
				line={props.line}
				currentLine={props.currentLine}
				currentTime={props.currentTime}
				seekCounter={props.seekCounter}
				playState={props.playState}
			/> }
		</div>
	)
}
function easeInOutSine(x) {
	return -(Math.cos(Math.PI * x) - 1) / 2;
}
function SingleLineScroller(props) {
	const wrapper = useRef(null);

	const containerWidth = props.containerWidth;
	const innerWidth = useRef(0);
	const scrollWidth = useRef(0);
	const scrollDuration = useRef(0);
	const scrollDelay = useRef(0);

	const animationFrame = useRef(null);
	const playedTime = useRef(0);

	const getCurrentOffset = () => {
		if (playedTime.current < scrollDelay.current) {
			return 0;
		}
		if (playedTime.current > scrollDelay.current + scrollDuration.current) {
			return scrollWidth.current;
		}
		const percentage = easeInOutSine((playedTime.current - scrollDelay.current) / scrollDuration.current);
		//console.log(playedTime.current, scrollDelay.current, scrollDuration.current, percentage, scrollWidth.current * percentage);
		return scrollWidth.current * percentage;
	}
	const setCurrentOffset = () => {
		if (!wrapper.current) return false;
		if (props.currentLine == props.id) {
			wrapper.current.style.transform = `translateX(-${getCurrentOffset()}px)`;
		}
		return true;
	}
	const lastTimestamp = useRef(null);
	const animationHandler = (timeStamp) => {
		if (lastTimestamp.current == null) lastTimestamp.current = timeStamp;
		if (props.id==0)console.log('animationHandler', playedTime.current, scrollDelay.current, scrollDuration.current, getCurrentOffset());
		playedTime.current += timeStamp - lastTimestamp.current;
		lastTimestamp.current = timeStamp;
		if (setCurrentOffset() && animationFrame.current){
			animationFrame.current = requestAnimationFrame(animationHandler);
		}
	}

	useEffect(() => {
		if (Math.abs(props.currentLine - props.id) >= 2) {
			// console.log(props.currentLine, props.id, props);
			if (animationFrame.current) {
				cancelAnimationFrame(animationFrame.current);
				animationFrame.current = null;
			}
			return;
		}
		if (props.playState == false) {
			if (animationFrame.current) {
				cancelAnimationFrame(animationFrame.current);
				animationFrame.current = null;
			}
			playedTime.current = props.currentTime - props.line.time;
			setCurrentOffset();
			return;
		}
		playedTime.current = Math.max(props.currentTime - props.line.time, 0);
	
		innerWidth.current = wrapper.current?.offsetWidth || innerWidth.current;
		scrollWidth.current = innerWidth.current - containerWidth;
		scrollDuration.current = props.line.duration * (scrollWidth.current / innerWidth.current) ?? 0;
		scrollDelay.current = props.line.duration * (innerWidth.current - scrollWidth.current) / 2 / innerWidth.current ?? 0;

		if(props.id==0)console.log(props,containerWidth,
			innerWidth.current,
			scrollWidth.current,
			scrollDuration.current,
			scrollDelay.current, playedTime.current);
	
		setCurrentOffset();
		animationFrame.current = requestAnimationFrame(animationHandler);
		/*return () => {
			if (animationFrame.current) {
				cancelAnimationFrame(animationFrame.current);
				animationFrame.current = null;
			}
		}*/
	}, [props.currentLine, props.currentTime, props.playState, props.seekCounter]);	
	
	return (
		<div className={`rnp-lyrics-single-line-wrapper`} ref={wrapper}>
			<SingleLine {...props}/>
		</div>
	)
}

function SingleLine(props) {

	const getKaraokeAnimation = (word) => {
		if (props.currentLine != props.id){
			return {
				transitionDuration: `200ms`,
				transitionDelay: `0ms`,
			};
		}
		if (props.playState == false && word.time + word.duration - props.currentTime > 0) {
			return {
				transitionDuration: `0s`,
				transitionDelay: `0ms`,
				opacity: Math.max(0.4 + 0.6 * (props.currentTime - word.time) / word.duration, 0.4),
				transform: `translateY(-${Math.max((props.currentTime - word.time) / word.duration * 2, 0)}px)`
			};
		}
		return {
			transitionDuration: `${word.duration}ms, ${word.duration + 150}ms`,
			transitionDelay: `${word.time - props.currentTime}ms`
		};
	};

	const karaokeLineRef = useRef(null);
	useEffect(() => {
		if (props.currentLine != props.id) return;
		if (!karaokeLineRef.current) return;
		karaokeLineRef.current.classList.add('force-refresh');
		setTimeout(() => {
			if (!karaokeLineRef.current) return;
			karaokeLineRef.current.classList.remove('force-refresh');
		}, 6);
	}, [props.useKaraokeLyrics, props.seekCounter, props.karaokeAnimation]);

	const CJKRegex = /([\p{Unified_Ideograph}|\u3040-\u309F|\u30A0-\u30FF])/gu;

	return (
		<>
			{ props.active == 'karaoke' && <div className="rnp-lyrics-line-karaoke" ref={karaokeLineRef}>
				{props.line.dynamicLyric.map((word, index) => {
					return <span
						key={`${props.karaokeAnimation} ${index}`}
						className={`rnp-karaoke-word ${CJKRegex.test(word.word) ? 'is-cjk' : ''} ${word.word.endsWith(' ') ? 'end-with-space' : ''}`}
						style={getKaraokeAnimation(word)}>
							{word.word}
					</span>
				})}
			</div> }
			{ props.active == 'original' && <div className="rnp-lyrics-line-original">
				{ props.line.originalLyric }
			</div> }
			{ props.active == 'romaji' && <div className="rnp-lyrics-line-romaji">
				{ props.line.romanLyric }
			</div> }
			{ props.active == 'translated' && <div className="rnp-lyrics-line-translated">
				{ props.line.translatedLyric }
			</div> }
		</>
	)
}

function Interlude(props) {
	const dotContainerRef = useRef(null);

	const dotCount = 3;
	const perDotTime = parseInt(props.line.duration / dotCount);
	const dots = [];
	for (let i = 0; i < dotCount; i++) {
		dots.push({
			time: props.line.time + perDotTime * i,
			duration: perDotTime,
		});
	}
	const dotAnimation = (dot) => {
		if (dotContainerRef.current) dotContainerRef.current.classList.add('pause-breath');
		if (props.currentLine != props.id){
			return {
				transitionDuration: `200ms`,
				transitionDelay: `0ms`,
			};
		}
		if (props.playState == false && dot.time + dot.duration - props.currentTime > 0) {
			return {
				transitionDuration: `0s`,
				transitionDelay: `0ms`,
				opacity: Math.max(0.2 + 0.7 * (props.currentTime - dot.time) / dot.duration, 0.2),
				transform: `scale(${Math.max(0.9 + 0.1 * (props.currentTime - dot.time) / dot.duration * 2, 0.8)}px)`
			};
		}
		if (dotContainerRef.current) dotContainerRef.current.classList.remove('pause-breath');
		return {
			transitionDuration: `${dot.duration}ms, ${dot.duration + 150}ms`,
			transitionDelay: `${dot.time - props.currentTime}ms`
		};
	};

	useEffect(() => {
		if (props.currentLine != props.id) return;
		if (!dotContainerRef.current) return;
		dotContainerRef.current.classList.add('force-refresh');
		setTimeout(() => {
			dotContainerRef.current?.classList?.remove('force-refresh');
		}, 6);
	}, [props.seekCounter]);

	return (
		<div className="rnp-interlude-inner" ref={dotContainerRef}>
			{dots.map((dot, index) => {
				return <div
					key={index}
					className="rnp-interlude-dot"
					style={dotAnimation(dot)}
				/>
			})}
		</div>
	)
}
