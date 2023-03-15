import { getSetting, setSetting } from './utils.js';

import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const useState = React.useState;
const useEffect = React.useEffect;
const useLayoutEffect = React.useLayoutEffect;
const useMemo = React.useMemo;
const useCallback = React.useCallback;
const useRef = React.useRef;

const darkTheme = createTheme({
	palette: {
		mode: 'dark',
	},
});
const lightTheme = createTheme({
	palette: {
		mode: 'light',
	},
});
const themes = {
	dark: darkTheme,
	light: lightTheme,
};

export function Settings(props) {
	const [theme, setTheme] = useState(document.body.classList.contains('ncm-light-theme') ? 'light' : 'dark');

	useEffect(() => {
		new MutationObserver(() => {
			if (document.body.classList.contains('ncm-light-theme')) {
				setTheme('light');
			} else {
				setTheme('dark');
			}
		}).observe(document.body, { attributes: true, attributeFilter: ['class'] });
	}, []);

	return (
		<ThemeProvider theme={themes[theme]}>
			<div className='lyric-bar-settings' style={{padding: '15px'}}>
				<Stack direction="column" spacing={2}>
					<FormGroup>
						<FormControlLabel control={
							<Switch defaultChecked={!!getSetting('adaptive-width', 'true')} onChange={(e) => {
								document.dispatchEvent(new CustomEvent('lb-adaptive-width', { detail: e.target.checked }));
								setSetting('adaptive-width', e.target.checked);
							}} />
						} label="自适应宽度" />
						
						<Stack direction="row" spacing={2} alignItems="flex-end">
							<FormControl style={{ width: 'fit-content' }}>
								<FormLabel>水平位置</FormLabel>
								<RadioGroup	row defaultValue={getSetting('posX', 'right')} onChange={(e) => {
									document.dispatchEvent(new CustomEvent('lb-posX', { detail: e.target.value }));
									setSetting('posX', e.target.value);
								}}>
									<FormControlLabel value="left" control={<Radio />} label="居左" />
									<FormControlLabel value="right" control={<Radio />} label="居右" />
								</RadioGroup>
							</FormControl>

							<FormControl style={{ width: 'fit-content' }}>
								<FormLabel>垂直位置</FormLabel>
								<RadioGroup	row defaultValue={getSetting('posY', 'bottom')} onChange={(e) => {
									document.dispatchEvent(new CustomEvent('lb-posY', { detail: e.target.value }));
									setSetting('posY', e.target.value);
								}}>
									<FormControlLabel value="top" control={<Radio />} label="居上" />
									<FormControlLabel value="bottom" control={<Radio />} label="居下" />
								</RadioGroup>
							</FormControl>
						</Stack>

						<FormControlLabel control={
							<Switch defaultChecked={!!getSetting('mouse-through', 'false')} onChange={(e) => {
								document.dispatchEvent(new CustomEvent('lb-mouse-through', { detail: e.target.checked }));
								setSetting('mouse-through', e.target.checked);
							}} />
						} label="鼠标穿透" />
						<Typography gutterBottom>不透明度</Typography>
						<Slider
							defaultValue={parseInt(getSetting('opacity', 100))}
							valueLabelDisplay="auto"
							min={5}
							max={100}
							onChange={(e, value) => {
								document.dispatchEvent(new CustomEvent('lb-opacity', { detail: value }));
								setSetting('opacity', value);
							}}
						/>

						<FormControlLabel control={
							<Switch defaultChecked={!!getSetting('show-translation', 'true')} onChange={(e) => {
								document.dispatchEvent(new CustomEvent('lb-show-translation', { detail: e.target.checked }));
								setSetting('show-translation', e.target.checked);
							}} />
						} label="显示翻译" />
						<FormControlLabel control={
							<Switch defaultChecked={!!getSetting('show-romaji', 'false')} onChange={(e) => {
								document.dispatchEvent(new CustomEvent('lb-show-romaji', { detail: e.target.checked }));
								setSetting('show-romaji', e.target.checked);
							}} />
						} label="显示罗马音" />
						<FormControlLabel control={
							<Switch defaultChecked={!!getSetting('use-karaoke-lyrics', 'true')} onChange={(e) => {
								document.dispatchEvent(new CustomEvent('lb-use-karaoke-lyrics', { detail: e.target.checked }));
								setSetting('use-karaoke-lyrics', e.target.checked);
							}} />
						} label="逐字歌词" />
					</FormGroup>
					<Typography gutterBottom>字体大小</Typography>
					<Slider
						defaultValue={parseInt(getSetting('lyric-font-size', 20))}
						valueLabelDisplay="auto"
						min={10}
						max={50}
						onChange={(e, value) => {
							document.dispatchEvent(new CustomEvent('lb-lyric-font-size', { detail: value }));
							setSetting('lyric-font-size', value);
						}}
						marks={[
							{ value: 20 }
						]}
					/>
					<FormControl>
						<FormLabel>文本对齐</FormLabel>
						<RadioGroup	row defaultValue={getSetting('text-align', 'center')} onChange={(e) => {
							document.dispatchEvent(new CustomEvent('lb-text-align', { detail: e.target.value }));
							setSetting('text-align', e.target.value);
						}}>
							<FormControlLabel value="left" control={<Radio />} label="居左" />
							<FormControlLabel value="center" control={<Radio />} label="居中" />
							<FormControlLabel value="right" control={<Radio />} label="居右" />
						</RadioGroup>
					</FormControl>
					<FormControlLabel control={
						<Switch defaultChecked={!!getSetting('first-line-bold', 'false')} onChange={(e) => {
							document.dispatchEvent(new CustomEvent('lb-first-line-bold', { detail: e.target.checked }));
							setSetting('first-line-bold', e.target.checked);
						}} />
					} label="加粗原文" />
				</Stack>
			</div>
		</ThemeProvider>
	);
}
