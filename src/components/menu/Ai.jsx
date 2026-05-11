import styles from '@/app/(pages)/menu/menu.module.scss'
import useAIStore from '@/store/aiStore';

export default function MenuCallAi() {
    const { menu, loading } = useAIStore();

    /* 분석중일때 */
    if (loading.menu) return (
        <div className={styles.graph}>
            <div className={styles.AItitle}>
                <p><img src="./img/icon/ic-AI.svg" alt="AI아이콘" /></p>
                <h3>AI 분석</h3>
            </div>

            <div className={styles.AllaiBox}>
                <div className={styles.aiBox}>
                    <div className={styles.aiBox2_title}>
                        <p><img src="./img/icon/menu-ai1.svg" alt="AI아이콘" /></p>
                        <span>인기 메뉴</span>
                    </div>
                    <div className={styles.aiBox2_text}>
                        <p>AI 분석 중...</p>
                    </div>
                </div>
                <div className={styles.aiBox2}>
                    <div className={styles.aiBox2_title}>
                        <p><img src="./img/icon/menu-ai2.svg" alt="AI아이콘" /></p>
                        <span>판매 부진</span>
                    </div>
                    <div className={styles.aiBox2_text}>
                        <p>AI 분석 중...</p>
                    </div>
                </div>
            </div>
        </div>
    );
 
    /* 메뉴가 없으면 */
    if (!menu) return (
        <div className={styles.graph}>
            <div className={styles.AItitle}>
                <p><img src="./img/icon/ic-AI.svg" alt="AI아이콘" /></p>
                <h3>AI 분석</h3>
            </div>

            <div className={styles.AllaiBox}>
                <div className={styles.aiBox}>
                    <div className={styles.aiBox2_title}>
                        <p><img src="./img/icon/menu-ai1.svg" alt="AI아이콘" /></p>
                        <span>인기 메뉴</span>
                    </div>
                    <div className={styles.aiBox2_text}>
                        <p>매출 데이터가 없습니다.</p>
                    </div>
                </div>
                <div className={styles.aiBox2}>
                    <div className={styles.aiBox2_title}>
                        <p><img src="./img/icon/menu-ai2.svg" alt="AI아이콘" /></p>
                        <span>판매 부진</span>
                    </div>
                    <div className={styles.aiBox2_text}>
                        <p>매출 데이터가 없습니다.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    /* 분석완료 */
    return (
        <div className={styles.graph}>
            <div className={styles.AItitle}>
                <p><img src="./img/icon/ic-AI.svg" alt="AI아이콘" /></p>
                <h3>AI 분석</h3>
            </div>

            <div className={styles.AllaiBox}>
                <div className={styles.aiBox}>
                    <div className={styles.aiBox2_title}>
                        <p><img src="./img/icon/menu-ai1.svg" alt="AI아이콘" /></p>
                        <span>인기 메뉴</span>
                    </div>
                    <div className={styles.aiBox2_text}>
                        <ul className={styles.aiBox2_text}>
                            <li>메뉴명: {menu?.max.name}</li>
                        </ul>
                        <ul className={styles.aiText}>
                            <li>{menu?.max.summary}</li>
                            <p>
                                <img src="./img/icon/arrow-right.svg" alt="AI화살표" />
                                {menu?.max.advice}
                            </p>
                        </ul>
                    </div>
                </div>
                <div className={styles.aiBox2}>
                    <div className={styles.aiBox2_title}>
                        <p><img src="./img/icon/menu-ai2.svg" alt="AI아이콘" /></p>
                        <span>판매 부진</span>
                    </div>
                    <div className={styles.aiBox2_text}>
                        <ul className={styles.aiBox2_text}>
                            <li>메뉴명: {menu?.min.name}</li>
                        </ul>
                        <ul className={styles.aiText}>
                            <li>{menu?.min.summary}</li>
                            <p>
                                <img src="./img/icon/arrow-right.svg" alt="AI화살표" />
                                {menu?.min.advice}
                            </p>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
