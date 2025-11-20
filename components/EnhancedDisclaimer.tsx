/**
 * 強化版免責聲明元件
 * 符合法律合規要求，保護使用者與開發者
 */

import React from 'react';

export const EnhancedDisclaimer: React.FC = () => (
  <div className="bg-yellow-900/50 border-2 border-yellow-500 p-6 rounded-lg shadow-lg">
    <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center">
      <span className="text-2xl mr-2">⚠️</span>
      重要免責聲明與風險警示
    </h3>
    
    <div className="space-y-4 text-sm text-yellow-100">
      <div className="bg-yellow-800/30 p-4 rounded-md border border-yellow-600">
        <p className="font-bold text-yellow-200 mb-2">
          📢 本系統為學術研究與教育用途，所有資訊僅供參考，不構成任何投資建議。
        </p>
      </div>
      
      <div>
        <h4 className="font-semibold text-yellow-300 mb-2">⚖️ 法律聲明</h4>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>本系統使用 AI 技術進行分析，可能存在誤差、延遲或不準確的情況</li>
          <li>所有股價數據來自第三方 API，本系統不保證其即時性、準確性或完整性</li>
          <li>歷史績效不代表未來表現，過去的成功案例不保證未來獲利</li>
          <li>本系統開發者、維護者及相關人員不對任何投資損失負責</li>
          <li>使用者應自行評估並承擔所有投資決策的全部責任與風險</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-yellow-300 mb-2">🔍 資料來源透明化</h4>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li><span className="font-semibold">即時股價：</span>優先使用台灣證交所官方 API，若失敗則使用 AI 搜尋結果作為備援</li>
          <li><span className="font-semibold">歷史數據：</span>來自台灣證交所 OpenAPI 的真實歷史交易資料</li>
          <li><span className="font-semibold">AI 分析：</span>由 Google Gemini 2.5 Flash 模型生成，結合網路公開資訊</li>
          <li><span className="font-semibold">技術指標：</span>基於真實歷史數據計算，但不保證預測準確性</li>
          <li><span className="font-semibold">新聞資訊：</span>透過 AI 搜尋獲取，可能存在時效性問題</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-yellow-300 mb-2">⚡ 風險警示</h4>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li className="text-red-300 font-semibold">股票投資具有高度風險，可能導致本金全部損失</li>
          <li>市場波動劇烈，短線交易風險更高，不適合所有投資人</li>
          <li>槓桿交易（融資融券）會放大獲利與虧損，需謹慎評估</li>
          <li>請勿投入無法承受損失的資金，建議僅使用閒置資金</li>
          <li>建議設定嚴格的停損點，並嚴格執行風險管理策略</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-yellow-300 mb-2">💡 專業建議</h4>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>使用本系統前，請先諮詢合格的專業財務顧問或證券分析師</li>
          <li>建議搭配多種資訊來源進行交叉驗證，不應單一依賴本系統</li>
          <li>投資前應充分了解標的公司基本面、產業趨勢及總體經濟環境</li>
          <li>建立適合自己的投資策略，並持續學習金融知識</li>
          <li>保持理性，避免情緒化交易，嚴守紀律</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-yellow-300 mb-2">📊 系統限制說明</h4>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>本系統僅分析股價 50 元以下的台股標的，不涵蓋所有市場</li>
          <li>AI 分析結果受限於訓練資料與演算法，可能存在偏誤</li>
          <li>即時股價更新頻率受限於 API 限制，可能有數秒延遲</li>
          <li>回測結果基於歷史數據，未考慮交易成本、滑價等實際因素</li>
          <li>系統可能因網路、API 或其他技術問題而暫時無法使用</li>
        </ul>
      </div>

      <div className="mt-6 pt-4 border-t-2 border-yellow-600">
        <p className="font-bold text-yellow-200 text-center text-base">
          ✅ 使用本系統即表示您已完整閱讀、理解並同意上述所有條款
        </p>
        <p className="text-center text-xs text-yellow-300 mt-2">
          最後更新日期：2025-11-20 | 版本：2.0
        </p>
      </div>
    </div>
  </div>
);

/**
 * 首次使用風險確認彈窗元件
 */
interface RiskConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RiskConfirmationModal: React.FC<RiskConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border-2 border-red-500 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center">
          <span className="text-3xl mr-3">🚨</span>
          風險警示與使用者協議
        </h2>
        
        <div className="space-y-4 text-sm text-gray-300 mb-6">
          <p className="text-red-300 font-semibold text-base">
            在使用本系統前，請務必仔細閱讀以下重要資訊：
          </p>
          
          <div className="bg-red-900/30 p-4 rounded-md border border-red-600">
            <p className="font-bold text-red-200">⚠️ 投資風險警告</p>
            <p className="mt-2">
              股票投資具有高度風險，可能導致本金全部損失。本系統提供的所有資訊僅供參考，
              不構成任何投資建議。您應自行評估並承擔所有投資決策的責任。
            </p>
          </div>

          <div className="bg-yellow-900/30 p-4 rounded-md border border-yellow-600">
            <p className="font-bold text-yellow-200">🤖 AI 技術限制</p>
            <p className="mt-2">
              本系統使用 AI 技術進行分析，可能存在誤差或不準確的情況。
              歷史績效不代表未來表現，請勿單一依賴本系統進行投資決策。
            </p>
          </div>

          <div className="bg-blue-900/30 p-4 rounded-md border border-blue-600">
            <p className="font-bold text-blue-200">📊 資料來源說明</p>
            <p className="mt-2">
              股價數據來自台灣證交所 API 與 AI 搜尋，可能有延遲或不準確的情況。
              使用前請自行驗證資料正確性。
            </p>
          </div>

          <p className="text-gray-400 text-xs mt-4">
            點擊「我已了解並同意」即表示您已完整閱讀並同意所有免責聲明與風險警示條款。
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            我已了解並同意
          </button>
        </div>
      </div>
    </div>
  );
};

