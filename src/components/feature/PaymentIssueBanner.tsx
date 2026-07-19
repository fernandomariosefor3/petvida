import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

const GRACE_PERIOD_DAYS = 7;

export default function PaymentIssueBanner() {
  const { currentUser } = useApp();
  if (!currentUser?.paymentFailedAt) return null;

  const failedAt = new Date(currentUser.paymentFailedAt);
  const daysAgo = Math.floor((Date.now() - failedAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, GRACE_PERIOD_DAYS - daysAgo);

  return (
    <div className="mx-6 mt-4 bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <i className="ri-error-warning-line text-red-500 text-lg"></i>
        <div>
          <p className="text-sm font-semibold text-red-700">Não conseguimos processar seu último pagamento</p>
          <p className="text-xs text-red-500">
            {daysLeft > 0
              ? `Atualize seu cartão em até ${daysLeft} dia${daysLeft === 1 ? '' : 's'} para não perder o acesso ao plano pago.`
              : 'Seu plano será movido para o Grátis em breve.'}
          </p>
        </div>
      </div>
      <Link to="/billing" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap">
        Atualizar pagamento
      </Link>
    </div>
  );
}
