// ===================================================
// Flavos IA 3.0 — Gemini Client Configuration
// ===================================================

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente do .env
dotenv.config({ path: '../../.env' });

/**
 * Nome do modelo Gemini.
 * Parametrizado via variável de ambiente para facilitar troca.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';

/**
 * API Key do Gemini.
 * NUNCA exposta ao cliente — usada apenas no backend.
 */
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    '⚠️  GEMINI_API_KEY não configurada. Defina em .env na raiz do projeto.'
  );
}

/**
 * Cliente do Google GenAI configurado com a API key.
 * Usado pelo router para gerar conteúdo com o Gemini.
 */
export const genAI = new GoogleGenAI({
  apiKey: apiKey || '',
});
