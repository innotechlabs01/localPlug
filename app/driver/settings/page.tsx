'use client';

import { useState, useEffect } from 'react';

/* The driver profile API returns snake_case rows (drivers table). This page maps
   them correctly and lets the driver pick a vehicle category, showing the fare
   they'll earn per trip (the payout model). */

interface Category {
  id: number; name: string; trip_fare_usd: number;
}

interface Profile {
  name: string; phone: string; email: string; city: string;
  vehicle: string; plate: string; category: string;
  vehicle_category_id: number | null;
  license_number: string; license_expiry: string;
  bank_account: string;
}

const CITIES = ['Medellín', 'Rionegro', 'Envigado', 'Bello', 'Itagüí', 'Sabaneta', 'Bogotá', 'Cartagena', 'Santa Marta'];

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v || 0);

export default function DriverSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fare, setFare] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [pRes, cRes] = await Promise.all([
          fetch('/api/driver/profile'),
          fetch('/api/driver/vehicle-categories'),
        ]);
        if (!pRes.ok) throw new Error('profile');
        const pData = await pRes.json();
        const d = pData.driver || {};
        const next: Profile = {
          name: d.name || '', phone: d.phone || '', email: d.email || '', city: d.city || '',
          vehicle: d.vehicle || '', plate: d.plate || '', category: d.category || 'standard',
          vehicle_category_id: d.vehicle_category_id ?? null,
          license_number: d.license_number || '', license_expiry: (d.license_expiry || '').slice(0, 10),
          bank_account: d.bank_account || '',
        };
        setProfile(next);
        const cats = (cRes.ok ? await cRes.json().then(x => x.categories || []) : []) as Category[];
        setCategories(cats);
        const active = cats.find(c => c.id === next.vehicle_category_id);
        setFare(active?.trip_fare_usd ?? null);
      } catch {
        setToast({ message: 'Error al cargar el perfil', type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const update = (field: keyof Profile, value: string | number | null) => {
    setProfile(p => (p ? { ...p, [field]: value as never } : p));
  };

  const onCategory = (idStr: string) => {
    if (!profile) return;
    const id = Number(idStr);
    const cat = categories.find(c => c.id === id);
    setProfile({ ...profile, vehicle_category_id: Number.isFinite(id) && id > 0 ? id : null, category: cat ? cat.name : profile.category });
    setFare(cat?.trip_fare_usd ?? null);
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!profile.name.trim() || !profile.vehicle.trim() || !profile.plate.trim()) {
      setToast({ message: 'Nombre, vehículo y placa son obligatorios', type: 'error' });
      return;
    }
    try {
      setSaving(true);
      const res = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile), // snake_case — matches the PUT route
      });
      if (!res.ok) throw new Error('save');
      setToast({ message: 'Perfil actualizado correctamente', type: 'success' });
    } catch {
      setToast({ message: 'Error al guardar los cambios', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
  };
  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-card)', borderRadius: 14, padding: 24, marginBottom: 24,
    border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: 'var(--text-secondary)', marginLeft: 12 }}>Cargando perfil...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--text-secondary)' }}>No se pudo cargar el perfil</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, padding: '16px 24px', borderRadius: 14,
          background: toast.type === 'success' ? 'var(--accent)' : 'var(--danger)',
          color: '#fff', zIndex: 1000, boxShadow: 'var(--shadow-elevated)',
        }}>{toast.message}</div>
      )}

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: '0 0 32px' }}>
          Configuración del Perfil
        </h1>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent-gold)', margin: '0 0 20px' }}>Perfil Personal</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input type="text" value={profile.name} onChange={e => update('name', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input type="tel" value={profile.phone} onChange={e => update('phone', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email (solo lectura)</label>
              <input type="email" value={profile.email} readOnly style={{ ...inputStyle, background: 'var(--bg-elevated)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={labelStyle}>Ciudad</label>
              <select value={profile.city} onChange={e => update('city', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent-gold)', margin: '0 0 20px' }}>Vehículo y Tarifa</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Tipo de vehículo</label>
              <input type="text" value={profile.vehicle} onChange={e => update('vehicle', e.target.value)} placeholder="Ej: Toyota Corolla" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Placa</label>
              <input type="text" value={profile.plate} onChange={e => update('plate', e.target.value.toUpperCase())} placeholder="ABC-123" style={{ ...inputStyle, textTransform: 'uppercase' }} />
            </div>
            <div>
              <label style={labelStyle}>Categoría del vehículo</label>
              <select
                value={profile.vehicle_category_id ?? ''}
                onChange={e => onCategory(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {fmt(c.trip_fare_usd)}/carrera</option>
                ))}
              </select>
            </div>
            {fare !== null && (
              <div style={{
                padding: '14px 16px', borderRadius: 12, fontSize: 14,
                background: 'rgba(212,168,75,0.12)', border: '1px solid var(--accent-gold)',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tu ganancia por carrera será: </span>
                <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{fmt(fare)}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, display: 'block', marginTop: 4 }}>
                  Se te paga cada semana por transferencia.
                </span>
              </div>
            )}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent-gold)', margin: '0 0 20px' }}>Documentos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Número de licencia</label>
              <input type="text" value={profile.license_number} onChange={e => update('license_number', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vencimiento de licencia</label>
              <input type="date" value={profile.license_expiry} onChange={e => update('license_expiry', e.target.value)} style={inputStyle} />
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent-gold)', margin: '0 0 20px' }}>Método de pago</h2>
          <div>
            <label style={labelStyle}>Cuenta bancaria para recibir tus pagos</label>
            <input type="text" value={profile.bank_account} onChange={e => update('bank_account', e.target.value)} placeholder="0000 0000 0000 0000" style={inputStyle} />
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 48 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '14px 32px', borderRadius: 14, border: 'none',
              background: saving ? 'var(--text-muted)' : 'var(--accent-gold)',
              color: '#fff', fontSize: 16, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}