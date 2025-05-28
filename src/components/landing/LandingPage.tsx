
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, HelpCircle, ArrowDown } from 'lucide-react';

const LandingPage = () => {
  const scrollToApply = () => {
    document.getElementById('apply-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToProcess = () => {
    document.getElementById('process-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <img 
              src="/lovable-uploads/8a63f40b-6935-4ee7-b788-560b8353aa1e.png" 
              alt="SAC John Fraser" 
              className="h-24 w-auto mx-auto mb-6"
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Join the <span className="text-blue-600">Student Council</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Make a difference at John Fraser Secondary School. Apply for a position on our Student Advisory Council and help shape the future of our school community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              onClick={scrollToApply}
            >
              Apply Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg"
              onClick={scrollToProcess}
            >
              Learn More
            </Button>
          </div>
          
          <div className="animate-bounce">
            <ArrowDown className="h-6 w-6 text-blue-600 mx-auto" />
          </div>
        </div>
      </section>

      {/* Why Apply Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Apply to SAC?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Being part of the Student Advisory Council is more than just a title – it's an opportunity to create lasting change and develop valuable leadership skills.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Leadership Development</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Develop essential leadership skills, public speaking abilities, and learn to work collaboratively with diverse groups of students and staff.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Make Real Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Influence school policies, organize events, and implement initiatives that directly improve the student experience at John Fraser.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Build Your Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Gain valuable experience that stands out on university applications and future job interviews. Develop skills employers value.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Positions Available Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Positions Available</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the role that best fits your interests and strengths. Each position offers unique opportunities to contribute to our school community.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">President</CardTitle>
                  <Badge variant="destructive">High Commitment</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Lead the Student Advisory Council and represent the student body in school-wide decisions and initiatives.
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Lead SAC meetings and initiatives</li>
                  <li>• Represent students to administration</li>
                  <li>• Organize major school events</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Vice President</CardTitle>
                  <Badge variant="secondary">High Commitment</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Support the President and step in when needed. Focus on internal SAC operations and student engagement.
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Assist President with duties</li>
                  <li>• Manage internal SAC operations</li>
                  <li>• Coordinate with committees</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Secretary</CardTitle>
                  <Badge>Medium Commitment</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Keep detailed records of meetings, manage communications, and maintain SAC documentation.
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Record meeting minutes</li>
                  <li>• Manage SAC communications</li>
                  <li>• Maintain records and files</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Treasurer</CardTitle>
                  <Badge>Medium Commitment</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Manage SAC budget, track expenses, and ensure financial transparency for all council activities.
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Manage SAC budget</li>
                  <li>• Track event expenses</li>
                  <li>• Financial reporting</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Events Coordinator</CardTitle>
                  <Badge>Medium Commitment</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Plan and execute school events, dances, fundraisers, and special activities throughout the year.
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Organize school events</li>
                  <li>• Coordinate with vendors</li>
                  <li>• Manage event logistics</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Grade Representative</CardTitle>
                  <Badge variant="outline">Low Commitment</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Represent your grade level and communicate student concerns and ideas to the SAC executive.
                </CardDescription>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Represent grade concerns</li>
                  <li>• Gather student feedback</li>
                  <li>• Participate in SAC meetings</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Application Process Section */}
      <section id="process-section" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Application Process</h2>
            <p className="text-xl text-gray-600">
              Our streamlined application process ensures every qualified candidate gets a fair opportunity to join SAC.
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Submit Application</h3>
                <p className="text-gray-600">
                  Complete the online application form with your position preference and thoughtful responses to our questions. Applications must be submitted by the deadline.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Review</h3>
                <p className="text-gray-600">
                  Current SAC executives and teacher supervisors review all applications based on leadership potential, commitment, and alignment with our values.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Interview Invitation</h3>
                <p className="text-gray-600">
                  Selected candidates will be invited for a personal interview. You'll receive an email with your scheduled time and interview details.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Final Decision</h3>
                <p className="text-gray-600">
                  After interviews, successful candidates will be notified via email and welcomed to the SAC family. Congratulations on taking this important step!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Got questions? We've got answers. Here are the most common questions about joining SAC.
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="eligibility" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Who is eligible to apply for SAC positions?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                All John Fraser Secondary School students in good academic standing are eligible to apply. You must have a valid PDSB email address (@pdsb.net) and demonstrate commitment to school involvement.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="commitment" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How much time commitment is required?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Time commitment varies by position. Executive roles (President, VP) require 5-8 hours per week, while committee members typically commit 2-4 hours per week. All members attend monthly meetings and special events.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="experience" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Do I need previous leadership experience?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                While leadership experience is valuable, it's not required. We look for students who show initiative, creativity, and genuine interest in making a positive impact on our school community.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="multiple" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                Can I apply for multiple positions?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                You can indicate multiple position preferences in your application, but you'll need to rank them in order of preference. We'll consider you for your top choices first.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="deadline" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                When is the application deadline?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Application deadlines are announced at the beginning of each school year. Typically, applications are due in late September, with interviews conducted in early October.
              </AccordionContent>
            </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="notification" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">
                How will I be notified about my application status?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                You'll receive email updates at each stage of the process: application confirmation, interview invitation (if selected), and final decision. Check your PDSB email regularly.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="apply-section" className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the next generation of student leaders at John Fraser Secondary School. Your voice matters, and we want to hear it.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
          >
            Start Your Application
          </Button>
          <p className="text-blue-200 text-sm mt-4">
            Sign in with your PDSB Google account to begin
          </p>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
