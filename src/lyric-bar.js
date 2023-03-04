import { Lyrics } from './lyrics.js'

import { getSetting, setSetting } from './utils.js';

const useState = React.useState;
const useEffect = React.useEffect;
const useLayoutEffect = React.useLayoutEffect;
const useMemo = React.useMemo;
const useCallback = React.useCallback;
const useRef = React.useRef;

export function LyricBar(props) {
	return (
		<>
			<Resizer />
			<div className='lyric-bar-inner'>
				<Lyrics />
			</div>
		</>
	)
}

function Resizer(props) {
	const ref = useRef();
	
	useEffect(() => {
		const onMouseMove = (e) => {
			const clientX = e.clientX;
			const containerRight = ref.current.parentElement.getBoundingClientRect().right;
			const width = Math.max(containerRight - clientX, 200);
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
	}, []);

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
		/>
	);
}