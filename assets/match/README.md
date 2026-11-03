# 경기 관중석 이미지

- `grandstand-source.png`: 이 프로젝트용으로 생성한 관중석 원화. 실제 구단·광고·경기장 사진이 아니다.
- `grandstand.webp`: 크기 변경 없이 WebP로 인코딩한 게임용 파일. 그라운드·선수·베이스는 포함하지 않는다.
- `src/ui/assets/00c_match_stadium_data.js`: 단일 HTML 배포에 쓰는 데이터 URI. 외부 이미지 요청 없이 동작한다.

원화는 관객·좌석·지붕·난간만 담았다. 경기장의 관중석 모양으로 SVG에서 잘라 넣으며 플레이 좌표를 바꾸지 않는다. 낮/밤 색감은 화면에서 조정한다.

재생성:

```sh
ffmpeg -v error -y -i assets/match/grandstand-source.png -c:v libwebp -quality 82 -compression_level 6 assets/match/grandstand.webp
node tools/embed-match-stand.cjs
bash build.sh
```
