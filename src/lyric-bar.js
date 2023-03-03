import { Lyrics } from './lyrics.js'

const useState = React.useState;
const useEffect = React.useEffect;
const useLayoutEffect = React.useLayoutEffect;
const useMemo = React.useMemo;
const useCallback = React.useCallback;
const useRef = React.useRef;

export function LyricBar(props) {
	return (
		<div className='lyric-bar-inner'>
			<Lyrics />
		</div>
	)
}