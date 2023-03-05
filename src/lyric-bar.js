import { Lyrics } from './lyrics.js'

import { getSetting, setSetting } from './utils.js';

const useState = React.useState;
const useEffect = React.useEffect;
const useLayoutEffect = React.useLayoutEffect;
const useMemo = React.useMemo;
const useCallback = React.useCallback;
const useRef = React.useRef;

export function LyricBar(props) {
	const [posX, setPosX] = useState(getSetting('posX', 'right'));
	const [posY, setPosY] = useState(getSetting('posY', 'bottom'));
	const [textAlign, setTextAlign] = useState(getSetting('text-align', 'left'));
	const [opacity, setOpacity] = useState(getSetting('opacity', 100));
	const [mouseThrough, setMouseThrough] = useState(!!getSetting('mouse-through', 'false'));

	const innerRef = useRef();

	useEffect(() => {
		const onPosXChange = (e) => {
			setPosX(e.detail ?? 'right');
		}
		const onPosYChange = (e) => {
			setPosY(e.detail ?? 'bottom');
		}
		const onTextAlignChange = (e) => {
			setTextAlign(e.detail ?? 'left');
		}
		const onOpacityChange = (e) => {
			setOpacity(e.detail ?? 100);
		}
		const onMouseThroughChange = (e) => {
			setMouseThrough(e.detail ?? false);
		}
		document.addEventListener("lb-posX", onPosXChange);
		document.addEventListener("lb-posY", onPosYChange);
		document.addEventListener("lb-text-align", onTextAlignChange);
		document.addEventListener("lb-opacity", onOpacityChange);
		document.addEventListener("lb-mouse-through", onMouseThroughChange);
		return () => {
			document.removeEventListener("lb-posX", onPosXChange);
			document.removeEventListener("lb-posY", onPosYChange);
			document.removeEventListener("lb-text-align", onTextAlignChange);
			document.removeEventListener("lb-opacity", onOpacityChange);
			document.removeEventListener("lb-mouse-through", onMouseThroughChange);
		}
	}, []);

	useEffect(() => {
		innerRef.current.parentElement.classList.toggle('posx-left', posX == 'left');
		innerRef.current.parentElement.classList.toggle('posx-right', posX == 'right');
	}, [posX]);

	useEffect(() => {
		innerRef.current.parentElement.classList.toggle('posy-top', posY == 'top');
		innerRef.current.parentElement.classList.toggle('posy-bottom', posY == 'bottom');
	}, [posY]);

	useEffect(() => {
		innerRef.current.parentElement.classList.toggle('text-align-left', textAlign == 'left');
		innerRef.current.parentElement.classList.toggle('text-align-center', textAlign == 'center');
		innerRef.current.parentElement.classList.toggle('text-align-right', textAlign == 'right');
	}, [textAlign]);

	useEffect(() => {
		innerRef.current.parentElement.style.opacity = opacity / 100;
	}, [opacity]);

	useEffect(() => {
		innerRef.current.parentElement.classList.toggle('mouse-through', mouseThrough);
	}, [mouseThrough]);

	return (
		<>
			<Resizer posX={posX} />
			<div className={`lyric-bar-inner`} ref={innerRef}>
				<Lyrics />
			</div>
		</>
	)
}

function Resizer(props) {
	const ref = useRef();
	
	useEffect(() => {
		const onMouseMove = (e) => {
			let width;
			if (props.posX == 'right') {
				const clientX = e.clientX;
				const containerRight = ref.current.parentElement.getBoundingClientRect().right;
				width = Math.max(containerRight - clientX, 200);
			} else if (props.posX == 'left') {
				const clientX = e.clientX;
				const containerLeft = ref.current.parentElement.getBoundingClientRect().left;
				width = Math.max(clientX - containerLeft, 200);
			}
			
			ref.current.parentElement.style.setProperty('--lyric-bar-width', `${width}px`);
			ref.current.parentElement.style.setProperty('--mask-image', `linear-gradient(90deg,
				rgba(0,0,0,0) 0%,
				rgba(0,0,0,0) ${5 / width * 100}%,
				rgba(0,0,0,1) ${15 / width * 100}%,
				rgba(0,0,0,1) ${100 - 15 / width * 100}%,
				rgba(0,0,0,0) ${100 - 5 / width * 100}%,
				rgba(0,0,0,0) 100%
			)`);
		};
		const onMouseUp = (e) => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
			document.querySelectorAll('.g-mn').forEach((el) => {
				el.style.pointerEvents = '';
			});
			setSetting('lyric-bar-width', ref.current.parentElement.style.getPropertyValue('--lyric-bar-width'));
		};
		const onMouseDown = (e) => {
			e.stopPropagation();
			window.addEventListener('mousemove', onMouseMove);
			window.addEventListener('mouseup', onMouseUp);
			document.querySelectorAll('.g-mn').forEach((el) => {
				el.style.pointerEvents = 'none';
			});
		};
		ref.current.addEventListener('mousedown', onMouseDown);
		return () => {
			ref.current.removeEventListener('mousedown', onMouseDown);
		};
	}, [props.posX]);

	useEffect(() => {
		ref.current.parentElement.style.setProperty('--lyric-bar-width', getSetting('lyric-bar-width', '400px'));
		ref.current.parentElement.style.setProperty('--mask-image', `linear-gradient(90deg,
			rgba(0,0,0,0) 0%,
			rgba(0,0,0,0) ${5 / 400 * 100}%,
			rgba(0,0,0,1) ${15 / 400 * 100}%,
			rgba(0,0,0,1) ${100 - 15 / 400 * 100}%,
			rgba(0,0,0,0) ${100 - 5 / 400 * 100}%,
			rgba(0,0,0,0) 100%
		)`);
	}, []);

	return (
		<div
			className='lyric-bar-resizer'
			ref={ref}
			style={{
				[props.posX == 'right' ? 'left' : 'right']: 0,
			}}
		/>
	);
}