import { getSetting, setSetting } from './utils.js';

import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const useState = React.useState;
const useEffect = React.useEffect;
const useLayoutEffect = React.useLayoutEffect;
const useMemo = React.useMemo;
const useCallback = React.useCallback;
const useRef = React.useRef;


export function Settings(props) {
	return (
		<div>
			<Typography gutterBottom>提示：Lyric Bar 现处于早期版本，可能会出现各种问题，欢迎反馈</Typography>
			<FormGroup>
				<FormControlLabel control={
					<Switch defaultChecked={!!getSetting('adaptive-width', 'true')} onChange={(e) => {
						document.dispatchEvent(new CustomEvent('lb-adaptive-width', { detail: e.target.checked }));
						setSetting('adaptive-width', e.target.checked);
					}} />
				} label="自适应宽度" />
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
			<FormControlLabel control={
				<Switch defaultChecked={!!getSetting('first-line-bold', 'false')} onChange={(e) => {
					document.dispatchEvent(new CustomEvent('lb-first-line-bold', { detail: e.target.checked }));
					setSetting('first-line-bold', e.target.checked);
				}} />
			} label="加粗原文" />
		</div>
	);
}
