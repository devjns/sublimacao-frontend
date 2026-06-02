'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function UploadPage() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [galleryLink, setGalleryLink] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    setError('');
    const file = fileRef.current?.files?.[0];
    if (!form.name || !form.email || !form.whatsapp || !file) {
      setError('Preencha todos os campos e selecione uma foto.');
      return;
    }
    const data = new FormData();
    data.append('name', form.name);
    data.append('email', form.email);
    data.append('whatsapp', form.whatsapp);
    data.append('photo', file);
    try {
      setLoading(true);
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/upload', { method: 'POST', body: data });
      if (!res.ok) throw new Error('Erro ao enviar');
      const json = await res.json();
      // Monta o link da galeria diretamente no frontend
      const base = window.location.origin;
      const token = json.accessToken;
      if (token) setGalleryLink(`${base}/gallery/${token}`);
      setStep('success');
    } catch {
      setError('Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--cream)' }}>
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl" style={{ background: 'var(--gold-light)' }}>🎨</div>
          <h2 className="font-display text-3xl mb-3" style={{ color: 'var(--charcoal)' }}>Foto recebida!</h2>
          <p className="mb-6" style={{ color: 'var(--warm-gray)' }}>
            Estamos criando suas telas personalizadas. Em alguns minutos elas estarão prontas no link abaixo — salve-o!
          </p>

          {galleryLink && (
            <div className="rounded-2xl p-5 mb-6 text-left" style={{ background: 'var(--warm-white)', border: '1.5px solid var(--gold-light)' }}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--warm-gray)' }}>Seu link da galeria</p>
              <a
                href={galleryLink}
                target="_blank"
                rel="noreferrer"
                className="block text-sm break-all underline mb-3"
                style={{ color: 'var(--gold-dark)' }}
              >
                {galleryLink}
              </a>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(galleryLink); alert('Link copiado!'); }}
                  className="flex-1 py-2 rounded-xl text-sm font-medium transition hover:opacity-90"
                  style={{ background: 'var(--gold-light)', color: 'var(--gold-dark)', border: '1px solid var(--gold)' }}
                >
                  📋 Copiar link
                </button>
                <Link
                  href={galleryLink}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-center transition hover:opacity-90"
                  style={{ background: 'var(--charcoal)', color: 'var(--gold-light)' }}
                >
                  Ver galeria →
                </Link>
              </div>
            </div>
          )}

          <p className="text-xs" style={{ color: 'var(--canvas-tan)' }}>
            A página da galeria atualiza automaticamente quando as artes ficarem prontas.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      <header className="flex justify-between items-center px-8 py-6 border-b" style={{ borderColor: 'var(--gold-light)' }}>
        <Link href="/" className="font-display text-2xl" style={{ color: 'var(--gold-dark)' }}>Artela</Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h1 className="font-display text-4xl mb-2" style={{ color: 'var(--charcoal)' }}>Criar minhas telas</h1>
          <p className="mb-8 text-sm" style={{ color: 'var(--warm-gray)' }}>Preencha seus dados e envie uma foto para começar.</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest font-medium block mb-1" style={{ color: 'var(--warm-gray)' }}>Nome</label>
              <input
                type="text"
                placeholder="Seu nome completo"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl outline-none transition"
                style={{ background: 'var(--warm-white)', border: '1.5px solid var(--gold-light)', color: 'var(--charcoal)' }}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-medium block mb-1" style={{ color: 'var(--warm-gray)' }}>E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl outline-none transition"
                style={{ background: 'var(--warm-white)', border: '1.5px solid var(--gold-light)', color: 'var(--charcoal)' }}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-medium block mb-1" style={{ color: 'var(--warm-gray)' }}>WhatsApp</label>
              <input
                type="text"
                placeholder="77999998888"
                value={form.whatsapp}
                onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                className="w-full px-4 py-3 rounded-xl outline-none transition"
                style={{ background: 'var(--warm-white)', border: '1.5px solid var(--gold-light)', color: 'var(--charcoal)' }}
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest font-medium block mb-1" style={{ color: 'var(--warm-gray)' }}>Sua foto</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl cursor-pointer overflow-hidden transition hover:opacity-90"
                style={{ border: '1.5px dashed var(--gold)', background: 'var(--warm-white)', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
                ) : (
                  <div className="text-center p-6">
                    <div className="text-3xl mb-2">📸</div>
                    <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>Clique para selecionar</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--canvas-tan)' }}>JPG, PNG ou WEBP · Máx 10MB</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-xl font-medium text-base transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--charcoal)', color: 'var(--gold-light)' }}
            >
              {loading ? 'Enviando...' : 'Gerar minhas telas ✨'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
