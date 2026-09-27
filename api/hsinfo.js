/**
 * 고등학교 학생 수 요약 (학교알리미 공시: 학년별·학급별 학생수, apiType 09)
 * GET /api/hsinfo?name=경북고등학교&addr=대구광역시 수성구 청호로 300
 * → { name, year, grades:[1학년,2학년,3학년], classes:[..], perClass:[..], total, teachers, perTeacher }
 */
const SGG = require("./_sgg.json");
const FALLBACK_KEY = "3415dfe6d4a8432480a2c8290e71b64e"; // TODO: Vercel 환경변수 SCHOOLINFO_KEY로 옮긴 뒤 삭제
const ALIAS = { "강원도": "강원특별자치도", "전라북도": "전북특별자치도", "제주도": "제주특별자치도" };

function sggFromAddr(addr) {
  let a = String(addr || "").trim().replace(/\s+/g, " ");
  for (const [o, n] of Object.entries(ALIAS)) if (a.startsWith(o)) a = n + a.slice(o.length);
  let best = null;
  for (const k of Object.keys(SGG)) if (a.startsWith(k + " ") || a === k) { if (!best || k.length > best.length) best = k; }
  return best ? SGG[best] : null;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
  const key = process.env.SCHOOLINFO_KEY || FALLBACK_KEY;
  const name = String(req.query.name || "").trim();
  const sgg = req.query.sgg || sggFromAddr(req.query.addr);
  if (!name || !sgg) return res.status(200).json({ error: "학교 이름과 주소가 필요해요", sgg });
  const kind = req.query.kind === "03" ? "03" : "04";
  const thisYear = new Date().getFullYear();
  try {
    for (const yr of [thisYear, thisYear - 1, thisYear - 2]) {
      const qs = new URLSearchParams({ apiKey: key, apiType: "09", schulKndCode: kind, sidoCode: String(sgg).slice(0, 2), sggCode: String(sgg), pbanYr: String(yr) });
      const d = await (await fetch(`https://www.schoolinfo.go.kr/openApi.do?${qs}`)).json();
      const list = d.list || [];
      const s = list.find((x) => x.SCHUL_NM === name) || list.find((x) => String(x.SCHUL_NM).includes(name) || name.includes(String(x.SCHUL_NM)));
      if (!s) continue;
      const n = (v) => Number(v) || 0;
      return res.status(200).json({
        name: s.SCHUL_NM, year: yr, type: s.HS_KND_SC_NM || "", found: s.FOND_SC_CODE || "", area: s.ADRCD_NM || "",
        grades: [n(s.COL_S1), n(s.COL_S2), n(s.COL_S3)], classes: [n(s.COL_C1), n(s.COL_C2), n(s.COL_C3)],
        perClass: [n(s.COL_1), n(s.COL_2), n(s.COL_3)], total: n(s.COL_S_SUM), perClassAvg: n(s.COL_SUM),
        teachers: n(s.TEACH_CNT), perTeacher: n(s.TEACH_CAL), source: "학교알리미 학년별·학급별 학생수"
      });
    }
    return res.status(200).json({ error: "학교알리미에서 이 학교를 찾지 못했어요", sgg });
  } catch (e) { return res.status(200).json({ error: String(e) }); }
};
