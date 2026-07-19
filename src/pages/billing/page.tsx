import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { useApp } from '@/contexts/AppContext';
import { usePlans } from '@/lib/plans';
import { functions } from '@/lib/firebase';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  pdfUrl: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  paid: 'Pago',
  open: 'Em aberto',
  void: 'Cancelado',
  uncollectible: 'Não cobrado',
};

export default function BillingPage() {
  const { currentUser, planId, isFree } = useApp();
  const { plans } = usePlans();
  const [portalLoading, setPortalLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isFree) { setInvoicesLoading(false); return; }
    const listInvoices = httpsCallable<unknown, { invoices: Invoice[] }>(functions, 'listInvoices');
    listInvoices()
      .then(({ data }) => setInvoices(data.invoices))
      .catch(() => setError('Não foi possível carregar seu histórico de pagamentos.'))
      .finally(() => setInvoicesLoading(false));
  }, [isFree]);

  async function handleManageSubscription() {
    setPortalLoading(true);
    setError('');
    try {
      const createPortalSession = httpsCallable<unknown, { url: string }>(functions, 'createPortalSession');
      const { data } = await createPortalSession();
      window.location.href = data.url;
    } catch {
      setError('Não foi possível abrir o portal de assinatura. Tente novamente.');
      setPortalLoading(false);
    }
  }

  if (!currentUser) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Assinatura e pagamentos</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie seu plano e veja seu histórico de cobranças</p>
        </div>

        {/* Current plan */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Plano atual</p>
              <p className="text-xl font-bold text-gray-800">{plans[planId].name}</p>
              {!isFree && currentUser.planExpiresAt && (
                <p className="text-sm text-gray-500 mt-1">
                  Próxima cobrança em {new Date(currentUser.planExpiresAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            {isFree ? (
              <Link to="/planos" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap">
                Ver planos pagos
              </Link>
            ) : (
              <button onClick={handleManageSubscription} disabled={portalLoading}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2">
                {portalLoading ? <><i className="ri-loader-4-line animate-spin"></i> Abrindo...</> : <><i className="ri-settings-3-line"></i> Gerenciar assinatura</>}
              </button>
            )}
          </div>
          {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
          {!isFree && (
            <p className="text-xs text-gray-400 mt-4">
              Cancelamentos, troca de cartão e nota fiscal ficam disponíveis no portal de assinatura acima (hospedado pela Stripe).
            </p>
          )}
        </div>

        {/* Payment history */}
        {!isFree && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Histórico de pagamentos</h3>
            </div>
            {invoicesLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm gap-2">
                <i className="ri-loader-4-line animate-spin"></i> Carregando...
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                Nenhum pagamento encontrado ainda.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{new Date(inv.date).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs text-gray-400">{STATUS_LABEL[inv.status] ?? inv.status}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-800">R${(inv.amount / 100).toFixed(2).replace('.', ',')}</span>
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 text-sm cursor-pointer">
                          <i className="ri-file-download-line"></i>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
