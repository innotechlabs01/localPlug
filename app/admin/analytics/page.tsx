          <span className="text-[10px] font-[600] text-[var(--fg-secondary)]">+22.5%</span>
          </div>
          <div className="absolute inset-0 h-0.5 bg-[var(--chart-mint)]" />
        </div>
        
        {/* Conversion Rate Card */}
        <div className="kpi-card kpi-conversion relative">
          <div className="kpi-top flex items-center justify-between">
            <div className="kpi-icon rose flex items-center justify-center w-9 h-9">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
          </div>
          <div className="kpi-label text-[11px] font-[600] text-[var(--fg-muted)] text-uppercase tracking-[0.8px]">
            {d.conversionRate || 'Conversion Rate'}
          </div>
          <div className="kpi-value text-[13px] font-[medium] text-[var(--fg)]">
            {data.conversionRate}%
          </div>
          <div className="kpi-sub up flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
            <span className="text-[10px] font-[600] text-[var(--fg-secondary)]">+2.1pp</span>
          </div>
          <div className="absolute inset-0 h-0.5 bg-[var(--chart-rose)]" />
        </div>
      </div>
      
      {/* ── CHARTS SECTION ── */}
      <div className="space-y-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-4">
          <div className="section-title flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            {d.monthlyRevenue || 'Monthly Revenue'}
          </div>
          <div className="h-[200px] relative">
            {/* Chart would go here - simplified for now */}
            <div className="absolute inset-0 flex items-center justify-center text-[var(--fg-secondary)]">
              Monthly Revenue Chart (Implementation from HTML)
            </div>
          </div>
        </div>
        
        {/* Service Popularity Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-4">
            <div className="section-title flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              {d.servicePopularity || 'Service Popularity'}
            </div>
            <div className="h-[200px] relative">
              {/* Chart would go here - simplified for now */}
              <div className="absolute inset-0 flex items-center justify-center text-[var(--fg-secondary)]">
                Service Popularity Chart (Implementation from HTML)
              </div>
            </div>
          </div>
          
          {/* Revenue Share Chart */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-4">
            <div className="section-title flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              {d.revenueShare || 'Revenue Share'}
            </div>
            <div className="h-[200px] relative">
              {/* Chart would go here - simplified for now */}
              <div className="absolute inset-0 flex items-center justify-center text-[var(--fg-secondary)]">
                Revenue Share Chart (Implementation from HTML)
              </div>
            </div>
          </div>
          
          {/* Airport Pickup Chart */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-4">
            <div className="section-title flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              {d.airportPickup || 'Airport Pickup'}
            </div>
            <div className="h-[200px] relative">
              {/* Chart would go here - simplified for now */}
              <div className="absolute inset-0 flex items-center justify-center text-[var(--fg-secondary)]">
                Airport Pickup Chart (Implementation from HTML)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}