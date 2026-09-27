/**
 * 학교알리미 공시정보 프록시
 * GET /api/schoolinfo?apiType=0&schulKndCode=04&sidoCode=27&sggCode=27260[&pbanYr=2025][&raw=1]
 * 키: Vercel 환경변수 SCHOOLINFO_KEY
 */
const FALLBACK_KEY = "3415dfe6d4a8432480a2c8290e71b64e"; // TODO: Vercel 환경변수로 옮긴 뒤 삭제
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
  const key = process.env.SCHOOLINFO_KEY || FALLBACK_KEY;
  if (req.query.scan) {
    const [a, b] = String(req.query.scan).split("-").map(Number);
    const types = []; for (let i = a; i <= Math.min(b, a + 29); i++) types.push(String(i).padStart(2, "0"));
    const out = await Promise.all(types.map(async (t) => {
      const q = new URLSearchParams({ apiKey: key, apiType: t, schulKndCode: req.query.schulKndCode || "04", sidoCode: req.query.sidoCode || "27", sggCode: req.query.sggCode || "27260", pbanYr: req.query.pbanYr || "2025", ...(req.query.depthNo ? { depthNo: req.query.depthNo } : {}) });
      try { const d = await (await fetch(`https://www.schoolinfo.go.kr/openApi.do?${q}`)).json(); const it = (d.list || [])[0];
        return [t, it ? Object.fromEntries(Object.entries(it).filter(([k]) => !/CODE|ORG|ADRCD|YN$|_NM$/.test(k)).slice(0, 40)) : (d.resultMsg || "").slice(0, 30)];
      } catch (e) { return [t, "err"]; }
    }));
    return res.status(200).json(Object.fromEntries(out));
  }
  const qs = new URLSearchParams({ apiKey: key });
  for (const k of ["apiType", "schulKndCode", "sidoCode", "sggCode", "pbanYr", "schulCode", "depthNo"]) if (req.query[k]) qs.set(k, String(req.query[k]));
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(`https://www.schoolinfo.go.kr/openApi.do?${qs}`, { signal: ctrl.signal });
    const txt = await r.text();
    if (req.query.raw === "1") return res.status(200).json({ status: r.status, head: txt.slice(0, 3000) });
    let data; try { data = JSON.parse(txt); } catch { return res.status(200).json({ error: txt.slice(0, 300) }); }
    let list = data.list || data.data || data;
    if (req.query.name && Array.isArray(list)) list = list.filter((x) => JSON.stringify(x).includes(String(req.query.name)));
    return res.status(200).json(Array.isArray(list) ? { count: list.length, list: list.slice(0, Number(req.query.limit) || 50), keys: list[0] ? Object.keys(list[0]) : [] } : data);
  } catch (e) { return res.status(200).json({ error: String(e) }); } finally { clearTimeout(t); }
};
