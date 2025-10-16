import Logo from "../../components/Logo";
import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8 space-y-6">
        <Logo />
        <h1 className="text-2xl font-semibold">Acesso negado</h1>
        <p className="text-gray-600">
          Sua conta n�o possui permiss�o para acessar o sistema.
          Se voc� acredita que isso � um engano, fale com o administrador.
        </p>
        <div className="flex gap-3">
          <Link to="/login" className="px-4 py-2 rounded-lg bg-gray-900 text-white">Voltar ao login</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg border border-gray-300">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}