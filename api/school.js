export default async function handler(req, res) {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "query 없음" });
  }

  try {
    const url = `https://open.neis.go.kr/hub/schoolInfo?KEY=3676939f31514d37a21cc35f9aa02cf6&Type=json&pIndex=1&pSize=20&SCHUL_NM=${encodeURIComponent(query)}`;

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "API 호출 실패" });
  }
}
