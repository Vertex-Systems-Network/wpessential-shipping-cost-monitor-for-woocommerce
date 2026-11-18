( function ( wp ) {
	'use strict';

	if ( ! wp || ! wp.element || ! wp.i18n ) {
		return;
	}

	const h = wp.element.createElement;
	const __ = wp.i18n.__;
	const _n = wp.i18n._n;
	const report = window.wpeScmDashboard || {};
	const groups = Array.isArray( report.groups ) ? report.groups : [];

	function moneyByCurrency( amountKey, countKey ) {
		return groups
			.filter( function ( group ) {
				return Number( group[ countKey ] ) > 0;
			} )
			.map( function ( group ) {
				return group.currency + ' ' + group[ amountKey ];
			} )
			.join( ' · ' ) || '—';
	}



	function MetricCard( props ) {
		return h(
			'section',
			{ className: 'wpe-scm-card wpe-scm-metric-card' + ( props.tone ? ' is-' + props.tone : '' ) },
			h( 'span', { className: 'wpe-scm-card-label' }, props.label ),
			h( 'strong', { className: 'wpe-scm-card-value' }, props.value ),
			h( 'span', { className: 'wpe-scm-card-note' }, props.note )
		);
	}

	function App() {
		const pro = window.wpeScmPro || {};
		const proPanel = 'function' === typeof pro.InvoicePanel ? pro.InvoicePanel : null;
		const eligible = Number( report.eligible_orders || 0 );
		const covered = Number( report.confirmed_cost_orders || 0 );
		const coverage = Number( report.coverage_percent || 0 );
		const period = report.period || {};
		const mismatchCount = Number( report.currency_mismatch_orders || 0 );
		const confirmedValue = moneyByCurrency( 'confirmed_cost', 'confirmed_orders' );
		const varianceValue = report.variance_available ? moneyByCurrency( 'variance', 'comparable_orders' ) : __( 'Not available', 'wpessential-shipping-margin-monitor-for-woocommerce' );
		const hasOrders = eligible > 0;
		const comparableVariances = report.variance_available ? groups.filter( function ( group ) { return Number( group.comparable_orders ) > 0; } ).map( function ( group ) { return Number( group.variance ); } ) : [];
		const varianceTone = comparableVariances.length < 1 || comparableVariances.some( function ( value ) { return ! Number.isFinite( value ); } )
			? ''
			: ( comparableVariances.every( function ( value ) { return value < 0; } ) ? 'negative' : ( comparableVariances.every( function ( value ) { return value > 0; } ) ? 'positive' : '' ) );
		const methodRows = groups.reduce( function ( rows, group ) {
			return rows.concat( ( group.shipping_methods || [] ).filter( function ( method ) { return Number( method.comparable_orders ) > 0; } ).map( function ( method ) { return Object.assign( { currency: group.currency }, method ); } ) );
		}, [] );
		const periodLabel = period.start && period.end ? period.start + ' — ' + period.end + ' (' + ( period.timezone || 'UTC' ) + ')' : __( 'Last 30 days', 'wpessential-shipping-margin-monitor-for-woocommerce' );

		return h(
			'main',
			{ className: 'wpe-scm-app' },
			h(
				'header',
				{ className: 'wpe-scm-header' },
				h(
					'div',
					null,
					h( 'p', { className: 'wpe-scm-eyebrow' }, __( 'SHIPPING INTELLIGENCE', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
					h( 'h1', null, __( 'Shipping Margin Monitor', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
					h( 'p', { className: 'wpe-scm-intro' }, __( 'Understand what customers paid for delivery and what your store paid to fulfil it.', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
					h( 'p', { className: 'wpe-scm-period' }, __( 'Order period:', 'wpessential-shipping-margin-monitor-for-woocommerce' ) + ' ' + periodLabel )
				),
				h(
					'div',
					{ className: 'wpe-scm-header-actions' },
					report.docs_url ? h( 'a', { className: 'button', href: report.docs_url }, __( 'Documentation', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ) : null,
					h(
						'a',
						{
							className: 'button button-primary wpe-scm-primary-action',
							href: 'admin.php?page=wc-orders',
						},
						__( 'View WooCommerce orders', 'wpessential-shipping-margin-monitor-for-woocommerce' )
					)
				)
			),
			h(
				'div',
				{ className: 'wpe-scm-report-toolbar' },
				h(
					'form',
					{ className: 'wpe-scm-report-controls', method: 'get' },
					h( 'input', { type: 'hidden', name: 'page', value: 'wpessential-shipping-margin-monitor-for-woocommerce' } ),
					h( 'label', null, __( 'From', 'wpessential-shipping-margin-monitor-for-woocommerce' ), h( 'input', { type: 'date', name: 'wpe_scm_start', value: period.start || '' } ) ),
					h( 'label', null, __( 'To', 'wpessential-shipping-margin-monitor-for-woocommerce' ), h( 'input', { type: 'date', name: 'wpe_scm_end', value: period.end || '' } ) ),
					h( 'button', { type: 'submit', className: 'button button-primary' }, __( 'Update report', 'wpessential-shipping-margin-monitor-for-woocommerce' ) )
				),
				report.export_url ? h( 'a', { className: 'button wpe-scm-export-action', href: report.export_url }, __( 'Export CSV', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ) : null
			),
			report.period_reset ? h( 'p', { className: 'wpe-scm-report-notice', role: 'status' }, __( 'The selected dates were invalid or exceeded 366 days. Showing the default 30-day period.', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ) : null,
			h(
				'section',
				{ className: 'wpe-scm-metrics', 'aria-label': __( 'Shipping cost summary', 'wpessential-shipping-margin-monitor-for-woocommerce' ) },
				h( MetricCard, {
					label: __( 'Shipping charged net', 'wpessential-shipping-margin-monitor-for-woocommerce' ),
					value: moneyByCurrency( 'shipping_charged', 'orders' ),
					note: __( 'After allocated shipping refunds; before shipping tax', 'wpessential-shipping-margin-monitor-for-woocommerce' ),
				} ),
				h( MetricCard, {
					label: __( 'Confirmed cost', 'wpessential-shipping-margin-monitor-for-woocommerce' ),
					value: confirmedValue,
					note: __( 'Invoice-final or merchant-confirmed; matching currency only', 'wpessential-shipping-margin-monitor-for-woocommerce' ),
				} ),
				h( MetricCard, {
					label: __( 'Shipping variance', 'wpessential-shipping-margin-monitor-for-woocommerce' ),
					value: varianceValue,
					tone: varianceTone,
					note: report.variance_available ? report.comparable_orders + ' ' + _n( 'order with matching currency and tax-exclusive cost', 'orders with matching currency and tax-exclusive cost', Number( report.comparable_orders ), 'wpessential-shipping-margin-monitor-for-woocommerce' ) : __( 'No comparable confirmed costs in this period', 'wpessential-shipping-margin-monitor-for-woocommerce' ),
				} ),
				h( MetricCard, {
					label: __( 'Cost coverage', 'wpessential-shipping-margin-monitor-for-woocommerce' ),
					value: hasOrders ? coverage + '%' : '—',
					note: hasOrders ? covered + ' / ' + eligible + ' ' + __( 'eligible orders', 'wpessential-shipping-margin-monitor-for-woocommerce' ) : __( 'No eligible orders in this period', 'wpessential-shipping-margin-monitor-for-woocommerce' ),
				} )
			),
			mismatchCount > 0 ? h(
				'p',
				{ className: 'wpe-scm-report-notice', role: 'status' },
				mismatchCount + ' ' + __( 'confirmed cost record(s) use a different currency and are excluded from the confirmed-cost total and coverage.', 'wpessential-shipping-margin-monitor-for-woocommerce' )
			) : null,
			methodRows.length > 0 ? h(
				'section',
				{ className: 'wpe-scm-card wpe-scm-method-report' },
				h( 'p', { className: 'wpe-scm-eyebrow' }, __( 'COST BY SHIPPING METHOD', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
				h( 'h2', null, __( 'Comparable shipping cost by method', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
				h( 'p', { className: 'wpe-scm-import-privacy' }, __( 'Variance includes only currency-matched, confirmed tax-exclusive cost records. Mixed-method orders are grouped by their method combination.', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
				h( 'div', { className: 'wpe-scm-import-table-wrap' },
					h( 'table', { className: 'widefat striped wpe-scm-import-table wpe-scm-method-table' },
						h( 'thead', null, h( 'tr', null,
							h( 'th', null, __( 'Shipping method', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
							h( 'th', null, __( 'Orders', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
							h( 'th', null, __( 'Shipping charged', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
							h( 'th', null, __( 'Confirmed cost', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
							h( 'th', null, __( 'Variance', 'wpessential-shipping-margin-monitor-for-woocommerce' ) )
						) ),
						h( 'tbody', null, methodRows.map( function ( method, index ) {
							return h( 'tr', { key: method.currency + '-' + index },
								h( 'td', null, method.label + ' (' + method.currency + ')' ),
								h( 'td', null, method.orders ),
								h( 'td', null, method.currency + ' ' + method.shipping_charged ),
								h( 'td', null, method.currency + ' ' + method.comparable_confirmed_cost ),
								h( 'td', null, method.currency + ' ' + method.variance )
							);
						} ) )
					)
				)
			) : null,
			h(
				'section',
				{ className: 'wpe-scm-card wpe-scm-empty-state', 'aria-live': 'polite' },
				h( 'div', { className: 'wpe-scm-empty-icon', 'aria-hidden': 'true' }, hasOrders ? '✓' : '↗' ),
				h( 'div', null,
					h( 'h2', null, hasOrders ? __( 'Currency-separated order summary', 'wpessential-shipping-margin-monitor-for-woocommerce' ) : __( 'No eligible shipping orders found', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
					h( 'p', null, hasOrders ? __( 'Variance uses net shipping after allocated refunds and only currency-matched, tax-exclusive confirmed costs.', 'wpessential-shipping-margin-monitor-for-woocommerce' ) : __( 'Eligible orders are Processing or Completed orders with a WooCommerce shipping line, created during the displayed period.', 'wpessential-shipping-margin-monitor-for-woocommerce' ) )
				)
			),
			proPanel ? h( proPanel ) : null,
			h(
				'div',
				{ className: 'wpe-scm-lower-grid' },
				h(
					'section',
					{ className: 'wpe-scm-card wpe-scm-next-card' },
					h( 'p', { className: 'wpe-scm-eyebrow' }, __( 'HOW THIS REPORT WORKS', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
					h( 'h2', null, __( 'Reporting scope', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
					h( 'p', null, __( 'Choose a date range of up to 366 days. CSV export includes refund allocation; custom statuses and multi-currency conversion are not supported.', 'wpessential-shipping-margin-monitor-for-woocommerce' ) )
				),
				h(
					'aside',
					{ className: 'wpe-scm-card wpe-scm-principle-card' },
					h( 'span', { className: 'wpe-scm-principle-mark', 'aria-hidden': 'true' }, '“' ),
					h( 'h2', null, __( 'Evidence before estimates', 'wpessential-shipping-margin-monitor-for-woocommerce' ) ),
					h( 'p', null, __( 'A quote is an estimate. A booked label is provisional. Only invoice-final or merchant-confirmed costs count as confirmed.', 'wpessential-shipping-margin-monitor-for-woocommerce' ) )
				)
			)
		);
	}

	function mount() {
		const root = document.getElementById( 'wpe-scm-root' );
		if ( ! root ) {
			return;
		}

		if ( wp.element.createRoot ) {
			wp.element.createRoot( root ).render( h( App ) );
		} else if ( wp.element.render ) {
			wp.element.render( h( App ), root );
		}
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', mount );
	} else {
		mount();
	}
} )( window.wp );
