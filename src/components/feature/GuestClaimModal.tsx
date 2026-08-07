import { Link } from 'react-router-dom';

interface GuestClaimModalProps {
  petName: string;
  onClose: () => void;
}

export default function GuestClaimModal({ petName, onClose }: GuestClaimModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">🐾</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Quase lá!</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Para salvar a carteirinha do <strong>{petName}</strong> na nuvem e receber lembretes
          no celular, crie sua conta em 1 clique.
        </p>
        <Link
          to="/register"
          className="block w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors cursor-pointer mb-3"
        >
          Criar conta grátis
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
