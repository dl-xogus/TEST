import styles from './signup.module.scss'

const page = () => {
  return (
    <div className="container">

      <div className="brand">
        <span className="brandTitle">Store</span>
        <span className="brandTitle">Pilot</span>

        <div className="brandDescription">
          매장 운영을 더 스마트하게 ㅡ AI 기반 재고·매출 관리
        </div>
      </div >


      <div className="box">
        <div className="boxTitle">이메일</div>
        <div className="boxText">이메일 입력</div>
      </div>
      <div className="box">
        <div className="boxTitle">비밀번호</div>
        <div className='passWord'>
          <div className="boxText">비밀번호 입력</div>
          <img src="/img/icon/eye.svg" alt="" />
        </div>


        <div className="loginForm">
          로그인
        </div>


        <div className="divider">
          <span className="dividerline"></span>
          <span className="dividerText"> 또는 </span>
          <span className="dividerline"></span>
        </div>
      </div>

      <div className="socialLogin">

        <div className="socialLogin-btn kakao">
          <img src="/img/loginbtn/kakao_login_btn.png" alt="카카오 로그인" />
        </div>

        <div className="socialLogin-btn naver">
          <img src="/img/loginbtn/naver_login_btn.png" alt="네이버 로그인" />
        </div>

        <div className="signupPrompt">
          <span className="signupText">아직 계정이 없나요?</span>
          <span className="signupLink">회원가입</span>
        </div>
      </div>






    </div >

  )
}

export default page
