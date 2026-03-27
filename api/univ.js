export default async function handler(req, res) {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "query 없음" });
  }

  try {
    const url = `https://api.data.go.kr/openapi/tn_pubr_public_univ_major_api?serviceKey=78f08217ff48ce1eee4558a87d21b5e76b6f51e8cab11637dd553e95bcb35bef&pageNo=1&numOfRows=20&type=json&univNm=${encodeURIComponent(query)}`;

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "API 호출 실패" });
  }
}
