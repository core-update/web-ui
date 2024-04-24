import { html, LitElement } from 'lit'
import { connect } from 'pwa-helpers'
import { store } from '../store'
import { doLoadNodeConfig, doRemoveNode, doSetNode } from '../redux/app/app-actions'
import { settingsPageStyles } from '../styles/core-css'
import snackbar from './snackbar'
import '../components/language-selector'
import '@material/mwc-button'
import '@material/mwc-dialog'
import '@material/mwc-icon'
import '@material/mwc-list/mwc-list-item.js'
import '@material/mwc-select'
import '@material/mwc-textfield'

// Multi language support
import { get, registerTranslateConfig, translate, use } from '../../translate'

registerTranslateConfig({
	loader: (lang) => fetch(`/language/${lang}.json`).then((res) => res.json())
})

const checkLanguage = localStorage.getItem('qortalLanguage')

if (checkLanguage === null || checkLanguage.length === 0) {
	localStorage.setItem('qortalLanguage', 'us')
	use('us')
} else {
	use(checkLanguage)
}

let settingsDialog

class SettingsPage extends connect(store)(LitElement) {
	static get properties() {
		return {
			lastSelected: { type: Number },
			nodeConfig: { type: Object },
			isBeingEdited: { type: Boolean },
			dropdownOpen: { type: Boolean },
			theme: { type: String, reflect: true }
		}
	}

	static get styles() {
		return [settingsPageStyles]
	}

	constructor() {
		super()
		this.nodeConfig = {}
		this.isBeingEdited = false
		this.isBeingEditedIndex = null
		this.dropdownOpen = false
		this.theme = localStorage.getItem('qortalTheme') ? localStorage.getItem('qortalTheme') : 'light'
	}

	render() {
		return html`
			<mwc-dialog id="settingsDialog" opened="false">
				<div style="display: inline; text-align: center;">
					<h1>${translate('settings.settings')}</h1>
					<hr />
				</div>
				<br />
				<div style="min-height: 250px; min-width: 500px; box-sizing: border-box; position: relative;">
					<div id="customSelect" @click="${this.toggleDropdown}" @blur="${this.handleBlur}" tabindex="0">
						<div class="selected">
							<div class="selected-left-side">
								<mwc-icon style="margin-right: 10px">link</mwc-icon>
								${this.selectedItem ?
									html `
										<div>
											<span class="name">${this.selectedItem.name}</span>
											<span>${this.selectedItem.protocol + '://' + this.selectedItem.domain + ':' + this.selectedItem.port}</span>
										</div>
									` : html`
										${translate('settings.selectnode')}
									`
								}
							</div>
							<mwc-icon>expand_more</mwc-icon>
						</div>
						<ul class="${this.dropdownOpen ? 'open' : ''}">
							${this.nodeConfig.knownNodes.map((n, index) => html`
								<li @click="${(e) => this.handleSelection(e, n, index)}">
									<div class="list-parent">
										<div>
											<span class="name">${n.name}</span>
											<span>${n.protocol + '://' + n.domain + ':' + n.port}</span>
										</div>
										<div>
											<mwc-button outlined @click="${(e) => this.removeNode(e, index)}">
												<mwc-icon class="buttonred">remove</mwc-icon>
											</mwc-button>
										</div>
									</div>
								</li>
							`)}
						</ul>
					</div>
					<p style="margin-top: 30px; text-align: center;">
						${translate('settings.nodehint')}
					</p>
					<center>
						<mwc-button outlined @click="${() => this.removeList()}">
							<mwc-icon class="buttonred">remove</mwc-icon>
							${translate('settings.deletecustomnode')}
						</mwc-button>
					</center>
					<br /><br />
				</div>
				<div style="min-height:100px; min-width: 300px; box-sizing: border-box; position: relative;">
					<hr />
					<br />
					<center>
						<div id="main">
							<mwc-icon class="globe">language</mwc-icon>&nbsp;<language-selector></language-selector>
						</div>
					</center>
				</div>
				<mwc-button slot="primaryAction" dialogAction="close" class="red">
					${translate('general.close')}
				</mwc-button>
			</mwc-dialog>
		`
	}

	firstUpdated() {
		const checkNode = localStorage.getItem('mySelectedNode')

		if (checkNode === null || checkNode.length === 0) {
			localStorage.setItem('mySelectedNode', 0)
		} else {
			this.handleSelectionOnNewStart(checkNode)
		}
	}

	handleSelectionOnNewStart(index) {
		this.localSavedNodes = JSON.parse(localStorage.getItem('myQortalNodes'))
		this.dropdownOpen = false
		this.selectedItem = this.localSavedNodes[index]
		this.requestUpdate()
	}

	toggleDropdown() {
		this.dropdownOpen = !this.dropdownOpen
	}

	handleBlur(event) {
		if (!this.shadowRoot.querySelector('#customSelect').contains(event.relatedTarget)) {
			this.dropdownOpen = false
		}
	}

	focusOnCustomSelect() {
		const customSelect = this.shadowRoot.querySelector('#customSelect')
		if (customSelect) {
			customSelect.focus()
		}
	}

	handleSelection(event, node, index) {
		event.stopPropagation()

		this.selectedItem = node
		this.dropdownOpen = false
		this.requestUpdate()
		this.nodeSelected(index)

		localStorage.setItem('mySelectedNode', index)

		const selectedNodeIndexOnNewStart = localStorage.getItem('mySelectedNode')
		const catchSavedNodes = JSON.parse(localStorage.getItem('myQortalNodes'))
		const selectedNodeOnNewStart = catchSavedNodes[selectedNodeIndexOnNewStart]
		const selectedNameOnNewStart = `${selectedNodeOnNewStart.name}`
		const selectedNodeUrlOnNewStart = `${selectedNodeOnNewStart.protocol + '://' + selectedNodeOnNewStart.domain + ':' + selectedNodeOnNewStart.port}`

		let snack2string = get('settings.snack2')

		snackbar.add({
			labelText: `${snack2string} : ${selectedNameOnNewStart} ${selectedNodeUrlOnNewStart}`,
			dismiss: true
		})
	}

	handleAddNodeSelection(node, index) {
		this.selectedItem = node
		this.dropdownOpen = false
		this.requestUpdate()
		this.nodeSelected(index)

		localStorage.setItem('mySelectedNode', index)

		const selectedNodeIndexOnNewStart = localStorage.getItem('mySelectedNode')
		const catchSavedNodes = JSON.parse(localStorage.getItem('myQortalNodes'))
		const selectedNodeOnNewStart = catchSavedNodes[selectedNodeIndexOnNewStart]
		const selectedNameOnNewStart = `${selectedNodeOnNewStart.name}`
		const selectedNodeUrlOnNewStart = `${selectedNodeOnNewStart.protocol + '://' + selectedNodeOnNewStart.domain + ':' + selectedNodeOnNewStart.port}`

		let snack2string = get('settings.snack2')

		snackbar.add({
			labelText: `${snack2string} : ${selectedNameOnNewStart} ${selectedNodeUrlOnNewStart}`,
			dismiss: true
		})
	}

	show() {
		this.shadowRoot.getElementById('settingsDialog').show()
	}

	close() {
		this.shadowRoot.getElementById('settingsDialog').close()
	}

	removeList() {
		localStorage.removeItem('myQortalNodes')

		const obj1 = {
			name: 'Web UI Node 1',
			protocol: 'https',
			domain: 'webapi.qortal.online',
			port: 443,
			enableManagement: false
		}

		var renewNodes = []

		renewNodes.push(obj1)

		localStorage.setItem('myQortalNodes', JSON.stringify(renewNodes))

		let snack1string = get('settings.snack1')

		snackbar.add({
			labelText: `${snack1string}`,
			dismiss: true
		})

		localStorage.removeItem('mySelectedNode')
		localStorage.setItem('mySelectedNode', 0)

		store.dispatch(doLoadNodeConfig())
	}

	nodeSelected(selectedNodeIndex) {
		const selectedNode = this.nodeConfig.knownNodes[selectedNodeIndex]
		const selectedName = `${selectedNode.name}`
		const selectedNodeUrl = `${selectedNode.protocol + '://' + selectedNode.domain + ':' + selectedNode.port}`
		const index = parseInt(selectedNodeIndex)

		if (isNaN(index)) return

		store.dispatch(doSetNode(selectedNodeIndex))

		localStorage.removeItem('mySelectedNode');
		localStorage.setItem('mySelectedNode', selectedNodeIndex)
	}

	removeNode(event, index) {
		event.stopPropagation()

		let stored = JSON.parse(localStorage.getItem('myQortalNodes'))

		stored.splice(index, 1)

		localStorage.setItem('myQortalNodes', JSON.stringify(stored))

		store.dispatch(doRemoveNode(index))

		let snack6string = get('settings.snack6')

		snackbar.add({
			labelText: `${snack6string}`,
			dismiss: true
		})
	}

	stateChanged(state) {
		this.config = state.config
		this.nodeConfig = state.app.nodeConfig
	}
}

window.customElements.define('settings-page', SettingsPage)

const settings = document.createElement('settings-page')
settingsDialog = document.body.appendChild(settings)
export default settingsDialog