'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface DriverProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  languages: string[];
  vehicleType: string;
  plate: string;
  category: string;
  vipCompatible: boolean;
  licenseNumber: string;
  licenseExpiry: string;
  bankAccount: string;
  bankName: string;
}

const CATEGORIES = ['Economy', 'Comfort', 'Premium', 'XL', 'VIP'];
const CITIES = ['Cancún', 'Playa del Carmen', 'Tulum', 'Mérida', 'Ciudad de México', 'Guadalajara', 'Monterrey'];
const VEHICLE_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Van', 'Pickup'];
const LANGUAGES = ['Español', 'Inglés', 'Francés', 'Alemán', 'Portugués', 'Italiano'];

export default function DriverSettingsPage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const ensureRes = await fetch('/api/driver/ensure');
      if (!ensureRes.ok) throw new Error('Error al verificar perfil');

      const profileRes = await fetch('/api/driver/profile');
      if (!profileRes.ok) throw new Error('Error al cargar perfil');

      const data = await profileRes.json();
      setProfile(data);
    } catch (error) {
      setToast({ message: 'Error al cargar el perfil', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      const res = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error('Error al guardar');

      setToast({ message: 'Perfil actualizado correctamente', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error al guardar los cambios', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof DriverProfile, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const toggleLanguage = (lang: string) => {
    if (!profile) return;
    const langs = profile.languages || [];
    if (langs.includes(lang)) {
      updateField('languages', langs.filter(l => l !== lang));
    } else {
      updateField('languages', [...langs, lang]);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent-gold)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginRight: 12,
        }} />
        <span style={{ color: 'var(--text-secondary)' }}>Cargando perfil...</span>
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const inputFocusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, focused: boolean) => {
    if (focused) {
      e.target.style.borderColor = 'var(--accent-gold)';
      e.target.style.boxShadow = '0 0 0 3px rgba(212, 168, 75, 0.12)';
    } else {
      e.target.style.borderColor = 'var(--border)';
      e.target.style.boxShadow = 'none';
    }
  };

  const sectionStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24,
          padding: '16px 24px', borderRadius: 14,
          background: toast.type === 'success' ? 'var(--accent)' : 'var(--danger)',
          color: '#fff', zIndex: 1000,
          boxShadow: 'var(--shadow-elevated)',
          animation: 'toastIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {toast.message}
          <style>{`
            @keyframes toastIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{
          fontSize: 28, fontWeight: 700,
          fontFamily: 'var(--font-display)',
          color: 'var(--text-primary)',
          marginBottom: 32, margin: '0 0 32px',
        }}>
          Configuración del Perfil
        </h1>

        <section style={sectionStyle}>
          <h2 style={{
            fontSize: 18, fontWeight: 600,
            color: 'var(--accent-gold)',
            marginBottom: 20, marginTop: 0,
          }}>
            Perfil Personal
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Nombre</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateField('name', e.target.value)}
                onFocus={(e) => inputFocusHandler(e, true)}
                onBlur={(e) => inputFocusHandler(e, false)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Teléfono</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                onFocus={(e) => inputFocusHandler(e, true)}
                onBlur={(e) => inputFocusHandler(e, false)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Email (solo lectura)</label>
              <input
                type="email"
                value={profile.email || user?.emailAddresses?.[0]?.emailAddress || ''}
                readOnly
                style={{
                  ...inputStyle,
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Ciudad</label>
              <select
                value={profile.city}
                onChange={(e) => updateField('city', e.target.value)}
                onFocus={(e) => inputFocusHandler(e, true)}
                onBlur={(e) => inputFocusHandler(e, false)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 10 }}>Idiomas</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      padding: '8px 16px', borderRadius: 20,
                      border: '1px solid',
                      borderColor: profile.languages?.includes(lang) ? 'var(--accent-gold)' : 'var(--border)',
                      background: profile.languages?.includes(lang) ? 'var(--accent-gold)' : 'transparent',
                      color: profile.languages?.includes(lang) ? '#000' : 'var(--text-secondary)',
                      fontSize: 13, fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!profile.languages?.includes(lang)) {
                        e.currentTarget.style.borderColor = 'var(--accent-gold-dim, #b08a5a)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!profile.languages?.includes(lang)) {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{
            fontSize: 18, fontWeight: 600,
            color: 'var(--accent-gold)',
            marginBottom: 20, marginTop: 0,
          }}>
            Vehículo
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Tipo de Vehículo</label>
              <select
                value={profile.vehicleType}
                onChange={(e) => updateField('vehicleType', e.target.value)}
                onFocus={(e) => inputFocusHandler(e, true)}
                onBlur={(e) => inputFocusHandler(e, false)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {VEHICLE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Placa</label>
              <input
                type="text"
                value={profile.plate}
                onChange={(e) => updateField('plate', e.target.value.toUpperCase())}
                placeholder="ABC-123"
                onFocus={(e) => inputFocusHandler(e, true)}
                onBlur={(e) => inputFocusHandler(e, false)}
                style={{ ...inputStyle, textTransform: 'uppercase' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Categoría</label>
              <select
                value={profile.category}
                onChange={(e) => updateField('category', e.target.value)}
                onFocus={(e) => inputFocusHandler(e, true)}
                onBlur={(e) => inputFocusHandler(e, false)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Compatible con VIP
              </span>
              <button
                onClick={() => updateField('vipCompatible', !profile.vipCompatible)}
                style={{
                  width: 48, height: 26,
                  borderRadius: 13, border: 'none',
                  background: profile.vipCompatible ? 'var(--accent-gold)' : 'var(--surface)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute', top: 3,
                  left: profile.vipCompatible ? 25 : 3,
                  transition: 'left 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{
            fontSize: 18, fontWeight: 600,
            color: 'var(--accent-gold)',
            marginBottom: 20, marginTop: 0,
          }}>
            Documentos
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Número de Licencia</label>
              <input
                type="text"
                value={profile.licenseNumber}
                onChange={(e) => updateField('licenseNumber', e.target.value)}
                onFocus={(e) => inputFocusHandler(e, true)}
                onBlur={(e) => inputFocusHandler(e, false)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Vencimiento de Licencia</label>
              <input
                type="date"
                value={profile.licenseExpiry?.split('T')[0] || ''}
                onChange={(e) => updateField('licenseExpiry', e.target.value)}
                onFocus={(e) => inputFocusHandler(e, true)}
                onBlur={(e) => inputFocusHandler(e, false)}
                style={inputStyle}
              />
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{
            fontSize: 18, fontWeight: 600,
            color: 'var(--accent-gold)',
            marginBottom: 20, marginTop: 0,
          }}>
            Método de Pago
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Número de Cuenta Bancaria</label>
              <input
                type="text"
                value={profile.bankAccount}
                onChange={(e) => updateField('bankAccount', e.target.value)}
                placeholder="0000 0000 0000 0000"
                onFocus={(e) => inputFocusHandler(e, true)}
                onBlur={(e) => inputFocusHandler(e, false)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 6 }}>Nombre del Banco</label>
              <input
                type="text"
                value={profile.bankName}
                onChange={(e) => updateField('bankName', e.target.value)}
                placeholder="Ej: BBVA, Santander, Banorte"
                onFocus={(e) => inputFocusHandler(e, true)}
                onBlur={(e) => inputFocusHandler(e, false)}
                style={inputStyle}
              />
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Aquí recibirás los depósitos de tus ganancias.
            </p>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 48 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '14px 32px', borderRadius: 14,
              border: 'none',
              background: saving ? 'var(--text-muted)' : 'var(--accent-gold)',
              color: '#fff', fontSize: 16, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: saving ? 0.7 : 1,
              boxShadow: saving ? 'none' : '0 0 20px rgba(212, 168, 75, 0.2)',
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.background = 'var(--accent-gold-light, #e8c9a0)';
                e.currentTarget.style.boxShadow = '0 0 24px rgba(212, 168, 75, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.background = 'var(--accent-gold)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 168, 75, 0.2)';
              }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
