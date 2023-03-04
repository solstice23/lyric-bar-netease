import './styles.scss';
import { waitForElement, waitForElementAsync, getSetting, setSetting, chunk, copyTextToClipboard } from './utils.js';
import { LyricBar } from './lyric-bar.js';
import { Settings } from './settings.js';
import { createRoot } from 'react-dom/client';


const injectCSS = (css) => {
	const style = document.createElement('style');
	style.innerHTML = css;
	document.head.appendChild(style);
}
const injectHTML = (type, html, parent, fun = (dom) => {}) => {
	const dom = document.createElement(type);
	dom.innerHTML = html;
	fun.call(this, dom);

	parent.appendChild(dom);
}

var lastCDImage = '';
const updateCDImage = () => {
	if (!document.querySelector('.g-single')) {
		return;
	}
	
	const imgDom = document.querySelector('.n-single .cdimg img');
	if (!imgDom) {
		return;
	}

	const realCD = document.querySelector('.n-single .cdimg');

	const update = () => {
		const cdImage = imgDom.src;
		if (cdImage === lastCDImage) {
			return;
		}
		lastCDImage = cdImage;
		calcAccentColor(imgDom);
	}

	if (imgDom.complete) {
		update();
		realCD.classList.remove('loading');
	} else {
		realCD.classList.add('loading');
	}
}
const addOrRemoveGlobalClassByOption = (className, optionValue) => {
	if (optionValue) {
		document.body.classList.add(className);
	} else {
		document.body.classList.remove(className);
	}
}


plugin.onLoad(async (p) => {	
	document.body.classList.add('refined-now-playing');

	if (!loadedPlugins['MaterialYouTheme']) {
		document.body.classList.add('no-material-you-theme');
	}

	waitForElement('#main-player', () => {
		const div = document.createElement('div');
		div.classList.add('lyric-bar');
		ReactDOM.render(<LyricBar/>, div);
		document.body.appendChild(div);
	});

});

plugin.onConfig((tools) => {
	const div = document.createElement('div');
	const divRoot = createRoot(div);
	divRoot.render(<Settings />);

	return div;
});