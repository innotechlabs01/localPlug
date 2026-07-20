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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Cargando perfil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <div style={{ color: 'var(--text-secondary)' }}>No se pudo cargar el perfil</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '24px' }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          padding: '16px 24px',
          borderRadius: 'var(--radius-md)',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toast.message}
        </div>
      )}

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '32px',
        }}>
          Configuración del Perfil
        </h1>

        {/* Perfil Personal */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid var(--border)',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--accent-gold)',
            marginBottom: '20px',
          }}>
            Perfil Personal
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nombre
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateField('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email (solo lectura)
              </label>
              <input
                type="email"
                value={profile.email || user?.emailAddresses?.[0]?.emailAddress || ''}
                readOnly
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Ciudad
              </label>
              <select
                value={profile.city}
                onChange={(e) => updateField('city', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Idiomas
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: profile.languages?.includes(lang) ? 'var(--accent-gold)' : 'var(--border)',
                      background: profile.languages?.includes(lang) ? 'var(--accent-gold)' : 'transparent',
                      color: profile.languages?.includes(lang) ? '#000' : 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Vehículo */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid var(--border)',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--accent-gold)',
            marginBottom: '20px',
          }}>
            Vehículo
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Tipo de Vehículo
              </label>
              <select
                value={profile.vehicleType}
                onChange={(e) => updateField('vehicleType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                {VEHICLE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Placa
              </label>
              <input
                type="text"
                value={profile.plate}
                onChange={(e) => updateField('plate', e.target.value.toUpperCase())}
                placeholder="ABC-123"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  textTransform: 'uppercase',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Categoría
              </label>
              <select
                value={profile.category}
                onChange={(e) => updateField('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Compatible con VIP
              </label>
              <button
                onClick={() => updateField('vipCompatible', !profile.vipCompatible)}
                style={{
                  width: '48px',
                  height: '26px',
                  borderRadius: '13px',
                  border: 'none',
                  background: profile.vipCompatible ? 'var(--accent-gold)' : 'var(--surface)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: '3px',
                  left: profile.vipCompatible ? '25px' : '3px',
                  transition: 'left 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          </div>
        </section>

        {/* Documentos */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid var(--border)',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--accent-gold)',
            marginBottom: '20px',
          }}>
            Documentos
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Número de Licencia
              </label>
              <input
                type="text"
                value={profile.licenseNumber}
                onChange={(e) => updateField('licenseNumber', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Vencimiento de Licencia
              </label>
              <input
                type="date"
                value={profile.licenseExpiry?.split('T')[0] || ''}
                onChange={(e) => updateField('licenseExpiry', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </section>

        {/* Método de Pago */}
        <section style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid var(--border)',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--accent-gold)',
            marginBottom: '20px',
          }}>
            Método de Pago
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Número de Cuenta Bancaria
              </label>
              <input
                type="text"
                value={profile.bankAccount}
                onChange={(e) => updateField('bankAccount', e.target.value)}
                placeholder="0000 0000 0000 0000"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nombre del Banco
              </label>
              <input
                type="text"
                value={profile.bankName}
                onChange={(e) => updateField('bankName', e.target.value)}
                placeholder="Ej: BBVA, Santander, Banorte"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}>
              Aquí recibirás los depósitos de tus ganancias.
            </p>
          </div>
        </section>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '48px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '14px 32px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: saving ? 'var(--text-muted)' : 'var(--admin-accent)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
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