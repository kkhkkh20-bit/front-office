# 팬 트럭 시위 기사 사진

가상 야구 팬 트럭 시위 기사용 사진 30종입니다. 장소 3종 × 10구단이며, 각 사진을 960×540·480×270 RGB WebP로 제공합니다. 실제 사건·구단·기업의 보도사진을 사용하지 않고 이미지 생성으로 제작했습니다.

1톤 흰색 트럭의 짐칸에 대형 LED 전광판을 설치한 정면 측면 구도입니다. 같은 장소의 구단별 버전은 옆면 현수막 색을 달리했습니다. 전광판과 현수막에는 문구·로고가 없고, 등장인물은 원경의 뒷모습으로 얼굴 식별이 불가능합니다. 실존 구단명·기업명은 사진에 없습니다.

[게임 연결 안내](CLAUDE_HANDOFF.md) · [manifest](manifest.json) · [검수 결과](validation.json)

|장소|장면 키|10구단 비교판|문구 위치 확인용 예시|
|---|---|---|---|
|홈구장 앞 낮|`stadium_day`|[보기](previews/stadium_day_all10.png)|[보기](previews/stadium_day_overlay_example.png)|
|홈구장 앞 밤|`stadium_night`|[보기](previews/stadium_night_all10.png)|[보기](previews/stadium_night_overlay_example.png)|
|모기업 본사 빌딩 앞 낮|`headquarters_day`|[보기](previews/headquarters_day_all10.png)|[보기](previews/headquarters_day_overlay_example.png)|

`960/`, `480/`의 런타임 사진은 전부 빈 전광판입니다. 예시 PNG의 문구·색상 가이드와 비교판의 구단 키 표시는 검수용으로만 들어 있습니다.

런타임 WebP 60개 합계 **3,544,190바이트**입니다. 960 버전 30개는 **2,700,884바이트**, 480 버전 30개는 **843,306바이트**입니다. 사진별 용량·SHA256·전광판 좌표는 manifest에, 파일 전체 해시는 `checksums.sha256`에 있습니다.

납품 브랜치: `assets/truck-protest-review`. 게임 코드·빌드·검사 파일은 변경하지 않았습니다. 게임 문구 연결과 사용자 확인은 후속 단계입니다.
