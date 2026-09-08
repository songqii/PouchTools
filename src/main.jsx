import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle, ArrowLeftRight, ArrowRight, Braces, Check, CheckCircle2, Clipboard,
  Clock3, Copy, Download, FileCode2, Hash, Languages, Link2, Moon, MoreVertical,
  Package, RefreshCw, Search, Settings, ShieldCheck, Star, Sun, Trash2, Upload,
  WandSparkles, X,
} from 'lucide-react';
import {
  decodeBase64, decodeUrl, dateToTimestamp, encodeBase64, encodeUrl, formatDateTime,
  formatJson, generateUuid, md5, minifyJson, timestampToDateString,
} from './utils.js';
import './styles.css';

const TOOL_DEFS = [
  { id: 'base64', zh: 'Base64 转码', en: 'Base64 encode/decode', Icon: FileCode2, group: 'common' },
  { id: 'md5', zh: 'MD5 摘要', en: 'MD5 hash', Icon: Hash, group: 'common' },
  { id: 'time', zh: '时间戳转换', en: 'Timestamp', Icon: Clock3, group: 'common' },
  { id: 'json', zh: 'JSON 格式化', en: 'JSON formatter', Icon: Braces, group: 'more' },
  { id: 'url', zh: 'URL 编解码', en: 'URL encode/decode', Icon: Link2, group: 'more' },
  { id: 'uuid', zh: 'UUID 生成', en: 'UUID generator', Icon: Package, group: 'more' },
];
const ZONES = ['Asia/Shanghai', 'UTC', 'America/Los_Angeles', 'Europe/Berlin', 'Asia/Tokyo'];
const DEFAULT_BASE64 = 'Hello, PouchTools!';
const DEFAULT_JSON = '{\n  "name": "PouchTools",\n  "version": "0.1.0",\n  "local": true\n}';

function storageGet(key, fallback) { try { const value = window.localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } }
function storageSet(key, value) { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* optional in restricted webviews */ } }
async function copyToClipboard(value) {
  const text = String(value ?? '');
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* fall through to the webview fallback */ }
  }
  const element = document.createElement('textarea'); element.value = text; element.style.position = 'fixed'; element.style.opacity = '0'; document.body.appendChild(element); element.focus(); element.select();
  const copied = document.execCommand('copy'); element.remove();
  if (!copied) throw new Error('Clipboard access is unavailable');
}
function downloadText(filename, text, type = 'text/plain') { const url = URL.createObjectURL(new Blob([text], { type })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.style.display = 'none'; document.body.appendChild(anchor); anchor.click(); window.setTimeout(() => { URL.revokeObjectURL(url); anchor.remove(); }, 0); }
function byteLength(value) { return new TextEncoder().encode(value).byteLength; }
function formatError(error, t) {
  if (error instanceof SyntaxError) return t('输入格式无效，请检查内容。', 'Invalid format. Check the input.');
  if (error instanceof URIError) return t('URL 格式无效，请检查编码内容。', 'Invalid URL encoding. Check the input.');
  if (error instanceof RangeError) return t('数值超出可处理范围。', 'The value is outside the supported range.');
  return error?.message || t('操作失败。', 'Operation failed.');
}

function zonedDateToEpoch(value, timeZone) {
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) throw new RangeError('Invalid date value');
  const [, year, month, day, hour, minute, second = '0'] = match;
  const numeric = [+year, +month, +day, +hour, +minute, +second];
  if (numeric[1] < 1 || numeric[1] > 12 || numeric[2] < 1 || numeric[3] > 23 || numeric[4] > 59 || numeric[5] > 59) {
    throw new RangeError('Invalid date value');
  }
  const probe = new Date(0);
  probe.setUTCFullYear(numeric[0], numeric[1] - 1, numeric[2]);
  probe.setUTCHours(numeric[3], numeric[4], numeric[5], 0);
  if (probe.getUTCFullYear() !== numeric[0] || probe.getUTCMonth() !== numeric[1] - 1 || probe.getUTCDate() !== numeric[2]) {
    throw new RangeError('Invalid date value');
  }
  const desired = probe.getTime();
  let candidate = desired;
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  for (let i = 0; i < 3; i += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(candidate)).map((part) => [part.type, part.value]));
    const projected = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    candidate += desired - projected;
  }
  return candidate;
}

function IconButton({ label, onClick, children, disabled = false, className = '' }) { return <button className={`icon-button ${className}`} type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}>{children}</button>; }
function Segmented({ options, value, onChange, compact = false }) { return <div className={`seg ${compact ? 'compact' : ''}`} role="tablist">{options.map((option) => <button type="button" key={option.value} className={value === option.value ? 'selected' : ''} onClick={() => onChange(option.value)} role="tab" aria-selected={value === option.value}>{option.label}</button>)}</div>; }
function CodeEditor({ label, value, onChange, onCopy, onClear, onDownload, readOnly = false, meta = '', placeholder = '' }) {
  const lines = Math.max(1, value.split('\n').length);
  return <section className="editor"><div className="editor-head"><strong>{label}</strong><div className="editor-tools"><IconButton label="Copy" onClick={onCopy}><Copy size={17} /></IconButton>{onDownload && <IconButton label="Download" onClick={onDownload}><Download size={17} /></IconButton>}<IconButton label="Clear" onClick={onClear}><Trash2 size={17} /></IconButton></div></div><div className="editor-body"><div className="line-numbers">{Array.from({ length: lines }, (_, index) => <span key={index}>{index + 1}</span>)}</div><textarea value={value} onChange={(event) => onChange?.(event.target.value)} readOnly={readOnly} spellCheck="false" placeholder={placeholder} /></div><div className="editor-foot"><span>{meta}</span><span>{byteLength(value)} bytes</span></div></section>;
}
function ResultField({ value, onCopy, label = 'Copy' }) { return <div className="result-field"><code>{value}</code><IconButton label={label} onClick={onCopy}><Copy size={17} /></IconButton></div>; }

function App() {
  const [active, setActive] = useState(() => storageGet('pouchtools.active', 'base64'));
  const [dark, setDark] = useState(() => storageGet('pouchtools.dark', false));
  const [english, setEnglish] = useState(() => storageGet('pouchtools.english', false));
  const [search, setSearch] = useState('');
  const [favorite, setFavorite] = useState(() => storageGet('pouchtools.favorite', false));
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const [notice, setNotice] = useState(null);
  const t = useCallback((zh, en) => (english ? en : zh), [english]);
  const notify = useCallback((message, kind = 'success') => { setNotice({ message, kind }); window.clearTimeout(window.__pouchtoolsNoticeTimer); window.__pouchtoolsNoticeTimer = window.setTimeout(() => setNotice(null), 2400); }, []);
  const handleCopy = useCallback(async (value) => { try { await copyToClipboard(value); notify(t('已复制到剪贴板', 'Copied to clipboard')); } catch { notify(t('复制失败，请检查系统权限。', 'Copy failed. Check system permissions.'), 'error'); } }, [notify, t]);
  useEffect(() => storageSet('pouchtools.active', active), [active]); useEffect(() => storageSet('pouchtools.dark', dark), [dark]); useEffect(() => storageSet('pouchtools.english', english), [english]); useEffect(() => storageSet('pouchtools.favorite', favorite), [favorite]);
  useEffect(() => { const onKeyDown = (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.querySelector('.search input')?.focus(); } }; window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown); }, []);
  const filteredTools = useMemo(() => { const term = search.trim().toLowerCase(); return term ? TOOL_DEFS.filter((tool) => `${tool.zh} ${tool.en}`.toLowerCase().includes(term)) : TOOL_DEFS; }, [search]);
  const activeTool = TOOL_DEFS.find((tool) => tool.id === active) || TOOL_DEFS[0];
  const resetWorkspace = () => { setActive('base64'); setSearch(''); setFavorite(false); setMenuOpen(false); setSettingsOpen(false); setWorkspaceVersion((version) => version + 1); notify(t('工作区已重置', 'Workspace reset')); };
  const selectTool = (id) => { setActive(id); setMenuOpen(false); };
  return <div className={`app ${dark ? 'dark' : ''}`}><header className="titlebar"><div className="brand-mini"><Package size={19} /><span>PouchTools</span></div></header><div className="shell"><aside className="sidebar"><div className="brand"><Package size={35} /><strong>PouchTools</strong></div><label className="search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('搜索工具', 'Search tools')} /><kbd>⌘K</kbd></label><div className="side-label">{t('常用', 'COMMON')}</div>{filteredTools.filter((tool) => tool.group === 'common').map((tool) => <ToolNav key={tool.id} tool={tool} active={active} onSelect={selectTool} t={t} />)}<div className="side-label more">{t('更多工具', 'MORE')}</div>{filteredTools.filter((tool) => tool.group === 'more').map((tool) => <ToolNav key={tool.id} tool={tool} active={active} onSelect={selectTool} t={t} />)}{filteredTools.length === 0 && <p className="search-empty">{t('没有匹配的工具', 'No matching tools')}</p>}<button className="sidebar-bottom" type="button" onClick={() => setSettingsOpen(true)}><Settings size={20} /><span>{t('设置', 'Settings')}</span></button></aside><main className="main"><div className="page-head"><h1>{t(activeTool.zh, activeTool.en)}</h1><div className="head-actions"><IconButton label={favorite ? t('取消收藏', 'Remove favorite') : t('收藏', 'Add favorite')} className={favorite ? 'favorite-on' : ''} onClick={() => { setFavorite(!favorite); notify(!favorite ? t('已添加收藏', 'Added to favorites') : t('已取消收藏', 'Removed from favorites')); }}><Star size={21} fill={favorite ? 'currentColor' : 'none'} /></IconButton><div className="menu-wrap"><IconButton label={t('更多操作', 'More actions')} onClick={() => setMenuOpen(!menuOpen)}><MoreVertical size={21} /></IconButton>{menuOpen && <div className="popover action-menu"><button type="button" onClick={() => { setSettingsOpen(true); setMenuOpen(false); }}><Settings size={16} />{t('打开设置', 'Open settings')}</button><button type="button" onClick={resetWorkspace}><RefreshCw size={16} />{t('重置工作区', 'Reset workspace')}</button></div>}</div></div></div>{active === 'base64' && <Base64 key={`base64-${workspaceVersion}`} t={t} copy={handleCopy} notify={notify} />}{active === 'md5' && <Md5 key={`md5-${workspaceVersion}`} t={t} copy={handleCopy} notify={notify} />}{active === 'time' && <Timestamp key={`time-${workspaceVersion}`} t={t} copy={handleCopy} notify={notify} />}{active === 'json' && <JsonTool key={`json-${workspaceVersion}`} t={t} copy={handleCopy} notify={notify} />}{active === 'url' && <UrlTool key={`url-${workspaceVersion}`} t={t} copy={handleCopy} notify={notify} />}{active === 'uuid' && <UuidTool key={`uuid-${workspaceVersion}`} t={t} copy={handleCopy} notify={notify} />}</main></div><footer><span><i /> {t('本地处理', 'Local processing')}</span><div><button type="button" onClick={() => setEnglish(!english)}><Languages size={15} />{english ? '中文' : 'EN'}</button><button type="button" onClick={() => setDark(!dark)}>{dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? t('浅色', 'Light') : t('深色', 'Dark')}</button></div></footer>{settingsOpen && <SettingsPanel dark={dark} english={english} setDark={setDark} setEnglish={setEnglish} onReset={resetWorkspace} onClose={() => setSettingsOpen(false)} t={t} />}{notice && <div className={`toast ${notice.kind}`}><span>{notice.kind === 'error' ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}</span>{notice.message}</div>}</div>;
}

function ToolNav({ tool, active, onSelect, t }) { const { Icon } = tool; return <button className={`nav ${active === tool.id ? 'active' : ''}`} type="button" onClick={() => onSelect(tool.id)}><Icon size={20} /><span>{t(tool.zh, tool.en)}</span></button>; }

function Base64({ t, copy, notify }) {
  const [mode, setMode] = useState('encode'); const [input, setInput] = useState(DEFAULT_BASE64); const [output, setOutput] = useState(() => encodeBase64(DEFAULT_BASE64)); const [urlSafe, setUrlSafe] = useState(false); const [recent, setRecent] = useState([]);
  const run = () => { try { const result = mode === 'encode' ? encodeBase64(input, { urlSafe }) : decodeBase64(input); setOutput(result); setRecent((items) => [{ input, output: result, mode }, ...items].slice(0, 3)); notify(t('转换完成', 'Conversion complete')); } catch (error) { setOutput(''); notify(formatError(error, t), 'error'); } };
  const switchMode = (next) => { if (next === mode) return; setMode(next); setInput(output); setOutput(input); }; const swap = () => { setInput(output); setOutput(input); setMode(mode === 'encode' ? 'decode' : 'encode'); };
  return <><div className="controls"><Segmented value={mode} onChange={switchMode} options={[{ value: 'encode', label: t('编码', 'Encode') }, { value: 'decode', label: t('解码', 'Decode') }]} /><span className="format-badge">UTF-8</span><label className="check-label"><input type="checkbox" checked={urlSafe} onChange={(event) => setUrlSafe(event.target.checked)} /> URL-safe</label></div><div className="editors"><CodeEditor label={t('原文', 'Source')} value={input} onChange={setInput} onCopy={() => copy(input)} onClear={() => setInput('')} onDownload={() => downloadText('pouchtools-input.txt', input)} meta="UTF-8" placeholder={t('输入文本…', 'Enter text…')} /><CodeEditor label={t('编码结果', 'Result')} value={output} onChange={setOutput} onCopy={() => copy(output)} onClear={() => setOutput('')} onDownload={() => downloadText('pouchtools-output.txt', output)} meta="Base64" /></div><div className="center-action"><button className="primary" type="button" onClick={run}>{mode === 'encode' ? t('编码', 'Encode') : t('解码', 'Decode')} <ArrowRight size={18} /></button><IconButton label={t('交换输入和结果', 'Swap input and result')} onClick={swap}><ArrowLeftRight size={18} /></IconButton><IconButton label={t('复制结果', 'Copy result')} onClick={() => copy(output)}><Clipboard size={18} /></IconButton></div><div className="recent"><h3>{t('最近转换', 'Recent conversions')}</h3>{recent.length === 0 ? <p className="muted-text">{t('执行一次转换后会显示在这里。', 'Run a conversion to see it here.')}</p> : recent.map((item, index) => <div className="recent-row" key={`${item.input}-${index}`}><span>{item.mode === 'encode' ? t('编码', 'Encode') : t('解码', 'Decode')}</span><code>{item.input.slice(0, 34)}</code><ArrowRight size={16} /><code>{item.output.slice(0, 42)}</code><IconButton label={t('复制', 'Copy')} onClick={() => copy(item.output)}><Copy size={16} /></IconButton></div>)}</div></>;
}

function Md5({ t, copy, notify }) {
  const [inputMode, setInputMode] = useState('text'); const [input, setInput] = useState('hello'); const [fileBytes, setFileBytes] = useState(null); const [digest, setDigest] = useState(() => md5('hello')); const [expected, setExpected] = useState(() => md5('hello')); const [uppercase, setUppercase] = useState(false); const [fileName, setFileName] = useState(''); const fileRef = useRef(null); const shownDigest = uppercase ? digest.toUpperCase() : digest;
  const changeInputMode = (next) => { setInputMode(next); if (next === 'text') setFileBytes(null); };
  const calculate = () => { try { if (inputMode === 'file') { if (!fileBytes) { notify(t('请先选择文件', 'Choose a file first'), 'error'); return; } setDigest(md5(fileBytes)); } else { setDigest(md5(input)); } notify(t('摘要计算完成', 'Hash calculated')); } catch (error) { notify(formatError(error, t), 'error'); } };
  const chooseFile = async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const bytes = new Uint8Array(await file.arrayBuffer()); setFileBytes(bytes); setInput(new TextDecoder().decode(bytes)); setFileName(file.name); setDigest(md5(bytes)); notify(t('文件已读取', 'File loaded')); } catch (error) { notify(formatError(error, t), 'error'); } };
  const clear = () => { setInput(''); setFileBytes(null); setDigest(''); setExpected(''); setFileName(''); if (fileRef.current) fileRef.current.value = ''; }; const inputSize = inputMode === 'file' && fileBytes ? fileBytes.byteLength : byteLength(input); const match = digest && expected && digest.toLowerCase() === expected.trim().toLowerCase();
  return <><div className="controls"><Segmented value={inputMode} onChange={changeInputMode} options={[{ value: 'text', label: t('文本', 'Text') }, { value: 'file', label: t('文件', 'File') }]} />{inputMode === 'file' && <><input ref={fileRef} className="visually-hidden" type="file" onChange={chooseFile} /><button className="outline control-button" type="button" onClick={() => fileRef.current?.click()}><Upload size={16} />{t('选择文件', 'Choose file')}</button></>}</div><section className="single-editor"><div className="editor-head"><strong>{inputMode === 'file' && fileName ? fileName : t('输入文本', 'Input')}</strong><div className="editor-tools"><IconButton label="Copy" onClick={() => copy(input)}><Copy size={17} /></IconButton><IconButton label="Clear" onClick={clear}><Trash2 size={17} /></IconButton></div></div><textarea value={input} onChange={(event) => setInput(event.target.value)} readOnly={inputMode === 'file'} placeholder={t('输入要计算摘要的内容…', 'Enter content to hash…')} /><div className="editor-foot"><span>{inputMode === 'file' ? t('原始文件', 'Original file') : 'UTF-8'}</span><span>{inputSize} bytes</span></div></section><div className="center-action"><button className="primary" type="button" onClick={calculate}>{t('计算摘要', 'Calculate hash')} <ShieldCheck size={18} /></button></div><section className="result"><div className="section-title"><h3>{t('摘要结果', 'Hash result')}</h3><Segmented compact value={uppercase ? 'upper' : 'lower'} onChange={(value) => setUppercase(value === 'upper')} options={[{ value: 'lower', label: t('小写', 'Lower') }, { value: 'upper', label: t('大写', 'Upper') }]} /></div><ResultField value={shownDigest || t('暂无结果', 'No result')} onCopy={() => copy(shownDigest)} /><small>MD5 · 32 {t('位十六进制字符', 'hex characters')}</small></section><section className="verify"><h3>{t('校验摘要', 'Verify hash')}</h3><div className="verify-line"><label>{t('预期 MD5', 'Expected MD5')}</label><input value={expected} onChange={(event) => setExpected(event.target.value)} placeholder="32-character MD5" /><IconButton label="Copy" onClick={() => copy(expected)}><Copy size={17} /></IconButton></div><div className={`status-strip ${match ? 'success' : 'muted'}`}>{match ? <Check size={18} /> : <AlertCircle size={18} />}{match ? t('匹配一致', 'Match confirmed') : t('输入摘要后进行校验', 'Enter a digest to verify')}</div></section></>;
}

function Timestamp({ t, copy, notify }) {
  const [unit, setUnit] = useState('seconds'); const [zone, setZone] = useState('Asia/Shanghai'); const [stamp, setStamp] = useState('1788834600'); const [date, setDate] = useState('2026-09-08 10:30:00'); const [leftResult, setLeftResult] = useState('2026-09-08 10:30:00'); const [rightSeconds, setRightSeconds] = useState('1788834600'); const [rightMilliseconds, setRightMilliseconds] = useState('1788834600000'); const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const convertLeft = () => { try { setLeftResult(timestampToDateString(stamp, { unit, timeZone: zone })); notify(t('时间戳已转换', 'Timestamp converted')); } catch (error) { notify(formatError(error, t), 'error'); } };
  const convertRight = () => { try { const epoch = zonedDateToEpoch(date, zone); setRightSeconds(String(dateToTimestamp(epoch, { unit: 'seconds' }))); setRightMilliseconds(String(dateToTimestamp(epoch, { unit: 'milliseconds' }))); notify(t('日期已转换', 'Date converted')); } catch (error) { notify(formatError(error, t), 'error'); } };
  const liveDate = formatDateTime(now, { timeZone: zone }); const liveStamp = String(dateToTimestamp(now, { unit }));
  return <><div className="now"><strong>{t('当前时间', 'Current time')}</strong><code>{liveDate}</code><IconButton label="Copy" onClick={() => copy(liveDate)}><Copy size={17} /></IconButton><code>{liveStamp}</code><IconButton label="Copy" onClick={() => copy(liveStamp)}><Copy size={17} /></IconButton><span className="live"><i /> {t('实时', 'Live')}</span></div><div className="time-cols"><section><h2>{t('时间戳 → 日期', 'Timestamp → Date')}</h2><label>Unix {t('时间戳', 'timestamp')}</label><div className="input-with-seg"><input value={stamp} onChange={(event) => setStamp(event.target.value)} /><Segmented compact value={unit} onChange={setUnit} options={[{ value: 'seconds', label: t('秒', 's') }, { value: 'milliseconds', label: t('毫秒', 'ms') }]} /></div><label>{t('时区', 'Timezone')}</label><select value={zone} onChange={(event) => setZone(event.target.value)}>{ZONES.map((item) => <option key={item}>{item}</option>)}</select><button className="primary small-btn" type="button" onClick={convertLeft}>{t('转换', 'Convert')} <ArrowRight size={17} /></button><label>{t('转换结果', 'Result')}</label><ResultField value={leftResult} onCopy={() => copy(leftResult)} /></section><section><h2>{t('日期 → 时间戳', 'Date → Timestamp')}</h2><label>{t('日期时间', 'Date and time')}</label><input value={date} onChange={(event) => setDate(event.target.value)} placeholder="YYYY-MM-DD HH:mm:ss" /><label>{t('时区', 'Timezone')}</label><select value={zone} onChange={(event) => setZone(event.target.value)}>{ZONES.map((item) => <option key={item}>{item}</option>)}</select><button className="outline small-btn" type="button" onClick={convertRight}>{t('转换', 'Convert')} <ArrowRight size={17} /></button><label>{t('转换结果', 'Result')}</label><ResultField value={rightSeconds} onCopy={() => copy(rightSeconds)} /><div className="result-field"><code>{rightMilliseconds}</code><span className="result-unit">ms</span><IconButton label="Copy" onClick={() => copy(rightMilliseconds)}><Copy size={17} /></IconButton></div></section></div><section className="other"><h2>{t('其他格式', 'Other formats')}</h2><div><span>UTC</span><code>{formatDateTime(now, { timeZone: 'UTC' })}</code><IconButton label="Copy" onClick={() => copy(formatDateTime(now, { timeZone: 'UTC' }))}><Copy size={16} /></IconButton></div><div><span>ISO 8601</span><code>{new Date(now).toISOString()}</code><IconButton label="Copy" onClick={() => copy(new Date(now).toISOString())}><Copy size={16} /></IconButton></div><div><span>{t('毫秒时间戳', 'Milliseconds')}</span><code>{now}</code><IconButton label="Copy" onClick={() => copy(now)}><Copy size={16} /></IconButton></div></section></>;
}

function JsonTool({ t, copy, notify }) {
  const [input, setInput] = useState(DEFAULT_JSON); const [output, setOutput] = useState(''); const [mode, setMode] = useState('format'); const [sortKeys, setSortKeys] = useState(false); const [indent, setIndent] = useState('2');
  const run = () => { try { const result = mode === 'format' ? formatJson(input, { indent: indent === 'tab' ? '\t' : Number(indent), sortKeys }) : minifyJson(input, { sortKeys }); setOutput(result); notify(t('JSON 处理完成', 'JSON processed')); } catch (error) { setOutput(''); notify(formatError(error, t), 'error'); } };
  return <><div className="controls"><Segmented value={mode} onChange={setMode} options={[{ value: 'format', label: t('格式化', 'Format') }, { value: 'minify', label: t('压缩', 'Minify') }]} />{mode === 'format' && <label className="inline-control">{t('缩进', 'Indent')}<select value={indent} onChange={(event) => setIndent(event.target.value)}><option value="2">2</option><option value="4">4</option><option value="tab">Tab</option></select></label>}<label className="check-label"><input type="checkbox" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} /> {t('按键名排序', 'Sort keys')}</label></div><div className="editors"><CodeEditor label={t('JSON 输入', 'JSON input')} value={input} onChange={setInput} onCopy={() => copy(input)} onClear={() => setInput('')} meta="JSON" placeholder="{ … }" /><CodeEditor label={t('处理结果', 'Result')} value={output} onChange={setOutput} onCopy={() => copy(output)} onClear={() => setOutput('')} onDownload={() => downloadText('formatted.json', output, 'application/json')} meta="JSON" /></div><div className="center-action"><button className="primary" type="button" onClick={run}>{mode === 'format' ? t('格式化 JSON', 'Format JSON') : t('压缩 JSON', 'Minify JSON')} <WandSparkles size={18} /></button><IconButton label={t('复制结果', 'Copy result')} onClick={() => copy(output)}><Clipboard size={18} /></IconButton></div>{output && <div className="status-strip success"><Check size={18} />{t('JSON 有效', 'Valid JSON')}</div>}</>;
}

function UrlTool({ t, copy, notify }) {
  const [mode, setMode] = useState('encode'); const [component, setComponent] = useState(true); const [input, setInput] = useState('https://example.com/search?q=你好 world'); const [output, setOutput] = useState('');
  const run = () => { try { setOutput(mode === 'encode' ? encodeUrl(input, { component }) : decodeUrl(input, { component })); notify(t('URL 处理完成', 'URL processed')); } catch (error) { setOutput(''); notify(formatError(error, t), 'error'); } };
  return <><div className="controls"><Segmented value={mode} onChange={setMode} options={[{ value: 'encode', label: t('编码', 'Encode') }, { value: 'decode', label: t('解码', 'Decode') }]} /><label className="check-label"><input type="checkbox" checked={component} onChange={(event) => setComponent(event.target.checked)} /> {t('编码组件', 'Component')}</label><span className="muted-text">{component ? 'encodeURIComponent' : 'encodeURI'}</span></div><div className="editors"><CodeEditor label={t('输入', 'Input')} value={input} onChange={setInput} onCopy={() => copy(input)} onClear={() => setInput('')} meta="URL" /><CodeEditor label={t('结果', 'Result')} value={output} onChange={setOutput} onCopy={() => copy(output)} onClear={() => setOutput('')} meta="URL" /></div><div className="center-action"><button className="primary" type="button" onClick={run}>{mode === 'encode' ? t('编码 URL', 'Encode URL') : t('解码 URL', 'Decode URL')} <ArrowRight size={18} /></button><IconButton label={t('交换输入和结果', 'Swap input and result')} onClick={() => { setInput(output); setOutput(input); }}><ArrowLeftRight size={18} /></IconButton><IconButton label={t('复制结果', 'Copy result')} onClick={() => copy(output)}><Clipboard size={18} /></IconButton></div></>;
}

function UuidTool({ t, copy, notify }) {
  const [count, setCount] = useState('1'); const [output, setOutput] = useState('');
  const generate = () => { const amount = Math.min(100, Math.max(1, Number.parseInt(count, 10) || 1)); setOutput(Array.from({ length: amount }, () => generateUuid()).join('\n')); notify(t(`${amount} 个 UUID 已生成`, `${amount} UUID${amount === 1 ? '' : 's'} generated`)); };
  return <><div className="controls uuid-controls"><label>{t('数量', 'Count')}<input type="number" min="1" max="100" value={count} onChange={(event) => setCount(event.target.value)} /></label><span className="muted-text">v4 · RFC 4122</span></div><section className="single-editor uuid-output"><div className="editor-head"><strong>{t('生成结果', 'Generated UUIDs')}</strong><div className="editor-tools"><IconButton label="Copy" onClick={() => copy(output)}><Copy size={17} /></IconButton><IconButton label="Clear" onClick={() => setOutput('')}><Trash2 size={17} /></IconButton></div></div><textarea value={output} onChange={(event) => setOutput(event.target.value)} placeholder={t('点击“生成 UUID”开始…', 'Click Generate UUID to start…')} spellCheck="false" /><div className="editor-foot"><span>UUID v4</span><span>{output ? output.split('\n').filter(Boolean).length : 0}</span></div></section><div className="center-action"><button className="primary" type="button" onClick={generate}><RefreshCw size={18} />{t('生成 UUID', 'Generate UUID')}</button><IconButton label={t('复制结果', 'Copy result')} onClick={() => copy(output)}><Clipboard size={18} /></IconButton></div></>;
}

function SettingsPanel({ dark, english, setDark, setEnglish, onReset, onClose, t }) { return <div className="overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="settings-panel" role="dialog" aria-modal="true" aria-label={t('设置', 'Settings')}><div className="panel-head"><h2>{t('设置', 'Settings')}</h2><IconButton label="Close" onClick={onClose}><X size={19} /></IconButton></div><label className="setting-row"><span>{t('深色模式', 'Dark mode')}</span><input type="checkbox" checked={dark} onChange={(event) => setDark(event.target.checked)} /></label><label className="setting-row"><span>{t('英文界面', 'English interface')}</span><input type="checkbox" checked={english} onChange={(event) => setEnglish(event.target.checked)} /></label><div className="setting-actions"><button className="outline" type="button" onClick={onReset}><RefreshCw size={16} />{t('重置工作区', 'Reset workspace')}</button><button className="primary" type="button" onClick={onClose}>{t('完成', 'Done')}</button></div></section></div>; }

createRoot(document.getElementById('root')).render(<App />);
