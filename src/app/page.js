"use client";

import FadeGroup from '@/components/FadeGroup';
import styles from '../app/landing.module.scss'
import Typing from '@/components/Typing';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Landing() {
  const router = useRouter();

  const { data: session } = useSession();
  console.log(session);


  return (
    <>

      <section className={styles.section1}>
        {/* 배경 그리드 */}
        <div className={styles.grid}></div>

        {/* 바닥 글로우 */}
        <div className={styles.bottomGlow}></div>

        <div className={styles.main_title}>
          <h2>Store<span>Pilot</span></h2>
          <h3>"복잡한 매장 관리, 이제 <span>로컬 AI</span>에게 맡기세요."</h3>
        </div>

        <div className={styles.main_txt}>
          <p>재고 예측부터 근무표 자동 생성까지, 데이터 유출 걱정 없는 로컬 LLM 기반 통합 솔루션.</p>
          <Typing />
        </div>

        <div className={styles.buttons}>
          <button className={styles.primary} onClick={() => router.push("/login")}>시작하기</button>
          <button className={styles.secondary}
            onClick={() => {
              document.getElementById("detail")?.scrollIntoView({
                behavior: "smooth",
              });
            }}>자세히 보기</button>
        </div>
      </section>


      {/* 핵심 기능 카드 */}
      <section className={styles.section2} id="detail">
        <h4>핵심 기능 카드</h4>
        <div className={styles.sec2}>

          <div className={styles.card_box}>
            <div className={styles.card_title}>
              <img src='./img/icon/landing_icon(1).svg' />
              <span>AI 예측</span>
            </div>
            <p>
              예측은 정확하게, 비용은 최소로.
              AI 분석을 통해 불필요한 비용을 줄이고 운영 효율을 극대화합니다.
            </p>
          </div>
          <div className={styles.card_box}>
            <div className={styles.card_title}>
              <img src='./img/icon/landing_icon(2).svg' />
              <span>매출 관리</span>
            </div>
            <p>
              매출은 올리고, 낭비는 줄입니다.
              데이터 기반 인사이트로 안정적인 매출 전략을 설계합니다.
            </p>
          </div>
          <div className={styles.card_box}>
            <div className={styles.card_title}>
              <img src='./img/icon/landing_icon(3).svg' />
              <span>메뉴 관리</span>
            </div>
            <p>
              메뉴 등록, 수정, 품절 관리를 한 곳에서 통합 관리할 수 있습니다.
              인기 메뉴 분석 및 효율적인 운영을 지원합니다.
            </p>
          </div>
          <div className={styles.card_box}>
            <div className={styles.card_title}>
              <img src='./img/icon/landing_icon(4).svg' />
              <span>직원 관리</span>
            </div>
            <p>
              데이터가 만드는 smarter한 매장 운영.
              근무 스케줄과 인건비를 효율적으로 관리하세요.
            </p>
          </div>

        </div>
      </section>


      {/* 기능 상세 3개 */}
      <section className={styles.section3}>

        <FadeGroup delay={0}>
          <div className={styles.function1}>
            <div className={styles.functionImg1}>
              <img src='./img/landing/landing_ai.png' className={styles.Aichat_Img} />
              <img src='./img/landing/landing_img1.png' className={styles.Ai_Img} />
            </div>
            <div className={styles.functionTxt1}>
              <h4>AI 예측 & 비용 절감</h4>
              <p>
                LM Studio 기반 로컬 LLM 사용으로 데이터는 안전하게, API 비용은 0원.
                AI 기반 분석을 통해 매출과 인건비 데이터를 통합적으로 해석하고, 불필요한 비용이 발생하는 지점을 식별합니다.
                수요 예측과 인력 최적화를 결합하여 운영 효율을 극대화하며, 데이터 기반 의사결정을 통해 지속적인 비용 절감 구조를 만들어냅니다.
              </p>
            </div>
          </div>
        </FadeGroup>


        <FadeGroup delay={150}>
          <div className={styles.function1}>
            <div className={styles.functionTxt1}>
              <h4>매출 관리</h4>
              <p>
                판매 추이를 분석해 발주 타이밍을 놓치지 않게 알려줍니다.
                과거 판매 데이터와 시즌성, 요일별 패턴을 분석하여 미래 매출을 예측합니다.
                데이터 흐름을 기반으로 변동성을 반영한 예측을 제공하여 보다 현실적인 매출 계획 수립이 가능합니다.
                이를 통해 재고 관리와 마케팅 전략을 사전에 준비할 수 있습니다.
              </p>
            </div>
            <div className={styles.functionImg1}>
              <img src='./img/landing/landing_img2.png' className={styles.g_Img} />
              <img src='./img/landing/sales.png' className={styles.sales_Img} />
            </div>
          </div>
        </FadeGroup>


        <FadeGroup delay={300}>
          <div className={styles.function1}>
            <div className={styles.functionImg2}>
              <img src='./img/landing/landing_img3.png' className={styles.back_Img} />
              <img src='./img/landing/landing_img4.png' className={styles.front_Img} />
            </div>
            <div className={styles.functionTxt1}>
              <h4>스마트 직원 관리</h4>
              <p>
                직원들의 희망 휴무를 반영해 최적의 스케줄을 추천해줍니다.
                과도한 인력 배치로 인한 비용 낭비와 인력 부족으로 인한 운영 차질을 동시에 방지하며, 효율적인 인건비 관리가 가능하도록 지원합니다.
                직관적인 관리 시스템을 통해 운영자의 부담도 줄일 수 있습니다.
              </p>
            </div>
          </div>
        </FadeGroup>


      </section>



      {/* 하단 내용 */}
      <section className={styles.section4}>
        <div className={styles.bottomText}>
          <span>지금 바로 스마트한 매장 운영을 시작하세요.</span>
        </div>
        <div className={styles.btn}>
          <button onClick={() => router.push("/login")}>시작하기<img src='./img/landing/Arrow.svg' className={styles.arrow} /></button>
        </div>

      </section>


      <footer className={styles.footer}>
        <div className={styles.footer_title}>
          <h2>Store<span>Pilot</span></h2>
          <p>© 2026 StorePilot. All rights reserved.</p>
        </div>
      </footer>





    </>



  );
}


